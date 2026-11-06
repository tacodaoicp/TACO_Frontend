// @dfinity/candid 3.4.3: slebDecode copies the whole rest of the reply twice for every int it reads, only to
// find where that int ends. A 650 KB chart reply full of int timestamps took 25 seconds to decode, the bytes
// themselves only a second to arrive. save() hands over the same bytes without a copy.
// The build stops if the line is gone, so a library update can't drop this unnoticed. Remove it once upstream fixes this.
const FILE = '/@dfinity/candid/lib/esm/utils/leb128.js'
const SLOW = 'const pipeView = new Uint8Array(pipe.buffer);'

export default function candidIntDecode() {
  return {
    name: 'candid-int-decode',
    enforce: 'pre',
    transform(code, id) {
      if (!id.split('?')[0].endsWith(FILE)) return null
      if (!code.includes(SLOW)) throw new Error(`candid-int-decode: ${FILE} changed, check slebDecode`)
      return { code: code.replace(SLOW, 'const pipeView = pipe.save();'), map: null }
    },
  }
}
