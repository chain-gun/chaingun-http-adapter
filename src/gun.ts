import { GunHttpClient, GunPut } from './client'
import ReconnectingWebSocket from 'reconnecting-websocket'

interface GunGet {
  '#': string
  get: {
    '#': string
  }
}

export const attachToGun = (Gun: any, options?: any) => {
  const { peers = [] } = options || {}

  Gun.on('create', function(this: any, db: any) {
    const http = (Gun.http = db.http = new GunHttpClient(Gun, options))

    function receive(msg: any) {
      try {
        db.on('in', { ...JSON.parse(msg.data || msg), from: 'websocket' })
      } catch (e) {
        console.error('Websocket error', e.stack || e)
      }
    }

    const sockets = peers.map((url: string) => {
      const ws = new ReconnectingWebSocket(url, [])
      ws.addEventListener('message', receive)
      return ws
    })

    db.on('get', async function(this: any, request: GunGet) {
      this.to.next(request)
      if (!request) {
        return
      }
      const dedupId = request['#']
      const get = request.get
      const soul = get['#']

      try {
        const result = await http.get(soul)
        db.on('in', {
          '@': dedupId,
          put: result
            ? {
                [soul]: result
              }
            : null,
          from: 'http',
          err: null
        })
      } catch (err) {
        console.error('error', err.stack || err)
        db.on('in', {
          '@': dedupId,
          put: null,
          from: 'http',
          err
        })
      }
    })

    db.on('put', async function(this: any, request: GunPut) {
      this.to.next(request)
      if (!request || request.from === 'http' || request.from === 'websocket') return
      for (let i = 0; i < sockets.length; i++) {
        try {
          sockets[i].send(JSON.stringify(request))
        } catch (e) {
          console.error('WebSocket error', e.stack || e)
        }
      }
    })

    this.to.next(db)
  })
}
