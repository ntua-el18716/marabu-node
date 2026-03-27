import canonicalize from 'canonicalize'
import { ObjectSchemaType } from './types'
import { blake2s } from 'hash-wasm'
import { knownObjectsDb } from './db'

const FIND_TIMEOUT_MS = 5000

interface PendingWaiter {
  resolve: (object: ObjectSchemaType) => void
  reject: (error: Error) => void
}

class ObjectManager {
  pendingFinds: Map<string, PendingWaiter[]> = new Map()

  id(object: ObjectSchemaType): Promise<string> {
    const canonicalized = canonicalize(object)
    if (canonicalized === undefined) {
      throw new Error('Failed to canonicalize object')
    }
    return blake2s(canonicalized)
  }

  async exists(id: string): Promise<boolean> {
    return await knownObjectsDb.has(id)
  }

  async get(id: string): Promise<ObjectSchemaType> {
    const object = await knownObjectsDb.get(id)
    if (object === undefined) {
      throw new Error(`Object ${id} not found`)
    }
    return object as unknown as ObjectSchemaType
  }

  async put(object: ObjectSchemaType): Promise<string> {
    const objectId = await this.id(object)
    await knownObjectsDb.put(objectId, object as any)

    const waiters = this.pendingFinds.get(objectId)
    if (waiters) {
      for (const waiter of waiters) {
        waiter.resolve(object)
      }
      this.pendingFinds.delete(objectId)
    }

    return objectId
  }

  async findObject(objectId: string, sendGetObject: (id: string) => void): Promise<ObjectSchemaType> {
    try {
      return await this.get(objectId)
    } catch { }

    sendGetObject(objectId)

    const waitPromise = new Promise<ObjectSchemaType>((resolve) => {
      const existing = this.pendingFinds.get(objectId)
      if (existing) {
        existing.push({ resolve, reject: () => { } })
      } else {
        this.pendingFinds.set(objectId, [{ resolve, reject: () => { } }])
      }

    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        this.pendingFinds.delete(objectId)
        reject(new Error(`Timeout waiting for object ${objectId}`))
      }, FIND_TIMEOUT_MS)
    })

    return Promise.race([waitPromise, timeoutPromise])
  }
}

export const objectManager = new ObjectManager()