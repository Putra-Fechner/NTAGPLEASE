//% weight=100 color=#0fbc11 icon="\uf2c2"

const RC522_CS = DigitalPin.P16
const RC522_RST = DigitalPin.P12

function initRC522() {
    pins.spiFrequency(1000000)
    pins.spiFormat(8, 0)
    pins.digitalWritePin(RC522_CS, 1)
}

function sendRawCommand(data: Buffer): void {
    pins.digitalWritePin(RC522_CS, 0)
    for (let i = 0; i < data.length; i++) {
        pins.spiWrite(data[i])
    }
    pins.digitalWritePin(RC522_CS, 1)
}

function isTagPresent(): boolean {
    initRC522()

    // Send REQA command to detect tag
    let buffer = pins.createBuffer(2)
    buffer.setUint8(0, 0x26) // REQA
    buffer.setUint8(1, 0x07) // Bit framing

    pins.digitalWritePin(RC522_CS, 0)
    for (let i = 0; i < buffer.length; i++) {
        pins.spiWrite(buffer.getUint8(i))
    }

    let response1 = pins.spiWrite(0)
    let response2 = pins.spiWrite(0)
    pins.digitalWritePin(RC522_CS, 1)

    return (response1 != 0 || response2 != 0)
}

namespace NTAG {
    //% block="NTAG write page %page data %text"
    //% page.min=4 page.max=39
    export function ntagWrite(page: number, text: string): void {
        initRC522()

        if (!isTagPresent()) {
            serial.writeLine("❌ No tag detected.")
            return
        }

        let buf = pins.createBuffer(6)
        buf.setUint8(0, 0xA2)
        buf.setUint8(1, page)

        for (let i = 0; i < 4; i++) {
            buf.setUint8(i + 2, text.charCodeAt(i) || 32)
        }

        sendRawCommand(buf)
        serial.writeLine("✅ Wrote to page " + page + ": " + text)
    }

    //% block="NTAG read page %page"
    //% page.min=4 page.max=39
    export function ntagRead(page: number): string {
        initRC522()

        let send = pins.createBuffer(2)
        send.setUint8(0, 0x30)
        send.setUint8(1, page)

        pins.digitalWritePin(RC522_CS, 0)
        for (let i = 0; i < 2; i++) {
            pins.spiWrite(send.getUint8(i))
        }

        let result = ""
        for (let i = 0; i < 4; i++) {
            let byte = pins.spiWrite(0)
            result += String.fromCharCode(byte)
        }
        pins.digitalWritePin(RC522_CS, 1)

        serial.writeLine("📖 Read from page " + page + ": " + result)
        return result
    }
}
