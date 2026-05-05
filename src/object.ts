import canonicalize from 'canonicalize'
import { ObjectSchemaUnwrappedType } from './types'
import { blake2s } from 'hash-wasm'
import { knownObjectsDb } from './db'

const FIND_TIMEOUT_MS = 8000
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface PendingWaiter {
  resolve: (object: ObjectSchemaUnwrappedType) => void
  reject: (error: Error) => void
}

class ObjectManager {
  pendingFinds: Map<string, PendingWaiter[]> = new Map()

  id(object: ObjectSchemaUnwrappedType): Promise<string> {
    const canonicalized = canonicalize(object)
    if (canonicalized === undefined) {
      throw new Error('Failed to canonicalize object')
    }
    return blake2s(canonicalized)
  }

  async exists(id: string): Promise<boolean> {
    return await knownObjectsDb.has(id)
  }

  async get(id: string): Promise<ObjectSchemaUnwrappedType> {
    const object = await knownObjectsDb.get(id)
    if (object === undefined) {
      throw new Error(`Object ${id} not found`)
    }
    return object
  }


  async put(object: ObjectSchemaUnwrappedType): Promise<string> {
    const objectId = await this.id(object)
    await knownObjectsDb.put(objectId, object)

    const waiters = this.pendingFinds.get(objectId)
    // console.log("PENDING", this.pendingFinds.get(objectId))
    await sleep(150);
    if (waiters) {
      this.pendingFinds.delete(objectId)
      for (const waiter of waiters) {
        console.log("WAITER", waiter)

        waiter.resolve(object)
      }
    }

    return objectId
  }

  async findObject(
    objectId: string,
    sendGetObject: (id: string) => void
  ): Promise<ObjectSchemaUnwrappedType> {
    try {
      return await this.get(objectId)
    } catch { }

    return new Promise<ObjectSchemaUnwrappedType>((resolve, reject) => {
      const existing = this.pendingFinds.get(objectId)
      const isFirstWaiter = !existing

      let settled = false

      const waiter: PendingWaiter = {
        resolve: (object) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          resolve(object)
        },
        reject: (error) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          reject(error)
        },
      }

      if (existing) {
        existing.push(waiter)

      } else {
        this.pendingFinds.set(objectId, [waiter])
      }

      const timer = setTimeout(() => {
        const current = this.pendingFinds.get(objectId)
        if (current) {
          const filtered = current.filter(w => w !== waiter)
          if (filtered.length > 0) {
            this.pendingFinds.set(objectId, filtered)
          } else {
            this.pendingFinds.delete(objectId)
          }
        }
        waiter.reject(new Error(`Timeout waiting for object ${objectId}`))
      }, FIND_TIMEOUT_MS)

      if (isFirstWaiter) {
        sendGetObject(objectId)
      }
    })
  }
}

export const blockHeights: Map<string, number> = new Map();

export let chainTip: { blockid: string, height: number } = {
  blockid: '',
  height: -1
}

export const objectManager = new ObjectManager()