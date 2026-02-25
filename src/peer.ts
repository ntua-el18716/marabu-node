export class Peer {
  id: string;
  validHandshake: boolean;

  constructor(peerId: string) {
    this.id = peerId;
    this.validHandshake = false;
  }
}