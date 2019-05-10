import 'isomorphic-fetch'

export interface GunNode {
  _: {
    '#': string
    '>': {
      [key: string]: number
    }
    [key: string]: any
  }
  [key: string]: any
}

export interface GunPutData {
  [soul: string]: GunNode
}

export interface GunPut {
  put: GunPutData
  from?: any
}

const DEFAULT_CONFIG = {
  root: '/gun/nodes/'
}

export class GunHttpClient {
  Gun: any
  env: any
  dbi: any
  config: typeof DEFAULT_CONFIG

  constructor(Gun: any, httpConfig = DEFAULT_CONFIG) {
    this.Gun = Gun
    this.config = { ...DEFAULT_CONFIG, ...httpConfig }
  }

  async getRaw(soul: string) {
    const response = await fetch(`${this.config.root}${soul}`)
    return response.text() || null
  }

  async get(soul: string) {
    if (!soul) return null

    try {
      const response = await fetch(`${this.config.root}${soul}`)
      if (response.status === 404) return null
      if (response.status >= 400) throw new Error('Bad response from server')
      return response.json() || null
    } catch (e) {
      console.error('gun-http get error', e.stack || e)
      throw e
    }
  }

  async read(soul: string) {
    const data = await this.get(soul)
    if (!data) return

    if (!this.Gun.SEA || soul.indexOf('~') === -1) return data

    for (let key in data) {
      if (key === '_') continue
      this.Gun.SEA.verify(
        this.Gun.SEA.opt.pack(data[key], key, data, soul),
        false,
        (res: GunNode) => (data[key] = this.Gun.SEA.opt.unpack(res, key, data))
      )
    }

    return data
  }

  async writeNode(soul: string, nodeData: GunNode) {
    if (!soul) return
    throw new Error('Write with gun-http not supported')
  }

  async write(put: GunPutData) {
    if (!put) return
    for (let soul in put) await this.writeNode(soul, put[soul])
  }

  close() {
    this.dbi.close()
    this.env.close()
  }
}

export function createClient(Gun: any, options: any) {
  return new GunHttpClient(Gun, options)
}
