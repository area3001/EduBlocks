
const BUFFER_SIZE = 32

interface ReadableStreamBYOBReader {
  readonly closed: Promise<void>;
  cancel(reason?: any): Promise<void>;
  read<T extends ArrayBufferView>(view: T): Promise<ReadableStreamReadResult<T>>;
  releaseLock(): void;
}

interface ReadableStream<R = any> {
  readonly locked: boolean;
  cancel(reason?: any): Promise<void>;
  getReader(options: { mode: "byob" }): ReadableStreamBYOBReader;
  getReader(): ReadableStreamDefaultReader<R>;
  pipeThrough<T>({ writable, readable }: { writable: WritableStream<R>, readable: ReadableStream<T> }, options?: PipeOptions): ReadableStream<T>;
  pipeTo(dest: WritableStream<R>, options?: PipeOptions): Promise<void>;
  tee(): [ReadableStream<R>, ReadableStream<R>];
}

interface GenericTransformStream {
  /**
   * Returns a readable stream whose chunks are strings resulting from running encoding's decoder on the chunks written to writable.
   */
  readonly readable: ReadableStream;
  /**
   * Returns a writable stream which accepts [AllowShared] BufferSource chunks and runs them through encoding's decoder before making them available to readable.
   * 
   * Typically this will be used via the pipeThrough() method on a ReadableStream source.
   * 
   * ```
   * var decoder = new TextDecoderStream(encoding);
   * byteReadable
   *   .pipeThrough(decoder)
   *   .pipeTo(textWritable);
   * ```
   * 
   * If the error mode is "fatal" and encoding's decoder returns error, both readable and writable will be errored with a TypeError.
   */
  readonly writable: WritableStream;
}

interface TextEncoderCommon {
  /**
   * Returns "utf-8".
   */
  readonly encoding: string;
}

interface TextEncoderStream extends GenericTransformStream, TextEncoderCommon {
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<string>;
}

declare var TextEncoderStream: {
  prototype: TextEncoderStream;
  new(): TextEncoderStream;
};

let outputStream: any;

export async function flashFri3dBadge(python: string, onProgress: (progress: number) => void) {
  console.log('FLASH fri3d', python);
  if (!('serial' in navigator)) {
    return
  }
  await connect();
  await put(python);
}


async function connect() {
  // let reader: { read: () => PromiseLike<{ value: any; done: any; }> | { value: any; done: any; }; releaseLock: () => void; };
  // async function readLoop() {
  //     console.log('Readloop');

  //     while (true) {
  //         const { value, done } = await reader.read();

  //         if (value) {
  //             log.textContent += value;
  //             log.scrollTop = log.scrollHeight;
  //         }
  //         if (done) {
  //             console.log('[readLoop] DONE', done);
  //             reader.releaseLock();
  //             break;
  //         }
  //     }
  // }

  // https://raw.githubusercontent.com/Microsoft/TypeScript/master/src/lib/dom.generated.d.ts
  
  // fri3dcamp { vendorId: 0x10C4 }

  const port = await (navigator as any).serial.requestPort();
  // - Wait for the port to open.
  await port.open({ baudrate: 115200 });

  // let decoder = new TextDecoderStream();
  // inputDone = port.readable.pipeTo(decoder.writable);
  // inputStream = decoder.readable;

  const encoder = new TextEncoderStream();
  const outputDone = encoder.readable.pipeTo(port.writable);
  outputStream = encoder.writable;

  // reader = inputStream.getReader();
  // readLoop();
}

async function writeToStream(line: string) {
  const writer = outputStream.getWriter();
  console.log('[SEND]', line);
  await writer.write(line);
  console.log('DONE WRITE')
  writer.releaseLock();
  console.log('DONE RELEASE')
}

function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enterRawRepl() {
  // http://docs.micropython.org/en/latest/reference/repl.html#raw-mode

  console.log('entering raw REPL');

  // sequence comes from ampy 
  // ctrl-C twice: interrupt any running program
  await writeToStream('\r\x03');
  await timeout(100);
  await writeToStream('\x03');
  await timeout(100);

  // ctrl-A: enter raw REPL
  await writeToStream('\r\x01');

  await timeout(100);
  // ctrl-D: soft reset
  await softReset();

  // Add a small delay and send Ctrl-C twice after soft reboot to ensure
  // any main program loop in main.py is interrupted.
  await timeout(500);
  await writeToStream('\x03');
  await timeout(100);
  await writeToStream('\x03');
}

async function exitRawRepl() {
  console.log('exiting raw REPL');
  await writeToStream('\r\x02');
}

/*
Put stores the argument cmds to the flash on board as the file named filename (main.py default) via rawrepl.
*/
async function put(cmds:string, filename = 'main.py', autoExec = true) {
  await enterRawRepl();
  console.log("uploading and executing", cmds);

  // Loop through each line and write a buffer size chunk of data at a time.
  await writeToStream("f = open('" + filename + "', 'wb')\r");

  const array = cmds.split('\n')
  for (let i = 0; i < array.length; i++) {
      const line = array[i];

      for (let j = 0; j < array[i].length; j += BUFFER_SIZE) {
          const chunk = line.slice(j, Math.min(array[i].length, j + BUFFER_SIZE))
          await writeToStream("f.write('" + chunk + "')\r");
      }

      await writeToStream("f.write('\\n')\r");
  }
  await writeToStream("f.close()\r");
  await timeout(100);

  // send CTRL signal to execute instructions in raw repl
  await softReset();
  await timeout(100);

  await exitRawRepl();

  // reset if needed
  // autoExec && await softReset();
  await softReset();
}

async function softReset() {
  await writeToStream('\x04');

}

// to quickly check the file via the python repl
// f = open("main.py", "r")
// print(f.readlines())
