import * as tmp from 'tmp';
import * as fs from 'fs';

const EventTarget: EventTargetConstructor = require('eventtarget');

interface EventBeforeDispatch {
  [key: string]: any;

  type: string;
}

interface Event {
  readonly cancelable: boolean;
  readonly defaultPrevented: boolean;
  readonly isTrusted: boolean;
  readonly target: EventTarget;
  readonly timeStamp: Date;

  preventDefault(): void;

  stopPropagation(): void;

  stopImmediatePropagation(): void;
}

interface EventTarget {
  addEventListener(type: string, listener: (event: Event) => void);

  removeEventListener(type: string, listener: (event: Event) => void);

  dispatchEvent(event: EventBeforeDispatch);
}

interface EventTargetConstructor {
  new(): EventTarget;
}

interface FileReaderEvent extends Event {
  readonly result: any;
}

function getTempPath(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    tmp.tmpName((err, path) => {
      if (err) reject(err);
      else {
        tempFiles.add(path);
        resolve(path);
      }
    });
  });
}

function fdopen(path: string, flags: string): Promise<number> {
  return new Promise<number>((resolve, reject) => fs.open(path, flags, (err, fd) => {
    if (err) reject(err);
    else resolve(fd);
  }));
}

function fdclose(fd: number): Promise<void> {
  return new Promise((resolve, reject) => fs.close(fd, err => {
    if (err) reject(err);
    else resolve();
  }))
}

function fdwriteFile(fd: number, path: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(<any>null, {fd});
    const reader = fs.createReadStream(path);
    reader.on('error', reject);
    reader.on('end', resolve);
    writer.on('error', reject);
    reader.pipe(writer, {end: false});
  });
}

function fdwrite(fd: number, str: string | Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => fs.write(fd, str, (err) => {
    if (err) reject(err);
    else resolve();
  }))
}

function fdread(fd: number, size: number, position: number): Promise<Buffer> {
  const buffer = Buffer.alloc(size);
  return new Promise<Buffer>((resolve, reject) => fs.read(fd, buffer, 0, size, position, (err) => {
    if (err) reject(err);
    else resolve(buffer);
  }))
}

const tempFiles: Set<string> = new Set;

const onExit: Array<() => void> = [];

process.on('exit', code => {
  for (const cb of onExit) cb();
  process.exit(code);
});

onExit.push(() => {
  for (const file of tempFiles) {
    fs.unlinkSync(file);
  }
});

interface BlobPropertyBag {
  type?: string;
  ending?: "transparent" | "native";
}

interface Blob {
  readonly size: number;
  readonly type: string;

  slice(start?: number, end?: number, contentType?: string): Blob;
}

interface FileReader {
  readonly error: Error;
  readonly readyState: number;
  readonly result: any;

  onabort?(e: FileReaderEvent): void;

  onerror?(e: FileReaderEvent): void;

  onload?(e: FileReaderEvent): void;

  onloadstart?(e: FileReaderEvent): void;

  onloadend?(e: FileReaderEvent): void;

  onprogress?(e: FileReaderEvent): void;

  abort(): void;

  readAsArrayBuffer(blob: Blob): void;

  readAsBinaryString(blob: Blob): void;

  readAsDataURL(blob: Blob): void;

  readAsText(blob: Blob): void;
}

class VBlob implements Blob {
  _path: string = '';
  _size: number;
  _offset: number = 0;
  _type: string;
  _writeTask: Promise<number> = Promise.resolve(0);

  private _write(fn: (fd: number) => void | Promise<void>): void {
    this._writeTask = this._writeTask.then(async (fd) => {
      if (!fd) {
        this._path = await getTempPath();
        fd = await fdopen(this._path, 'w+');
      }
      await fn(fd);
      return fd;
    });
  }

  private _writeEnd(): void {
    this._writeTask = this._writeTask.then(fd => fdclose(fd)).then(() => 0);
  }

  constructor(array?: any[], options?: BlobPropertyBag) {
    this._type = (options && options.type) || '';

    if (!array) {
      this._path = '';
      this._size = 0;
    } else {
      var size = 0;
      for (const value of array) {
        if (value instanceof ArrayBuffer) {
          if (value.byteLength === 0) continue;
          this._write(fd => fdwrite(fd, new Uint8Array(value)));
          size += value.byteLength;
        } else if (value instanceof Uint8Array) {
          if (value.byteLength === 0) continue;
          this._write(fd => fdwrite(fd, value));
          size += value.byteLength;
        } else if (
            (value instanceof Int8Array) ||
            (value instanceof Uint8ClampedArray) ||
            (value instanceof Int16Array) ||
            (value instanceof Uint16Array) ||
            (value instanceof Int32Array) ||
            (value instanceof Uint32Array) ||
            (value instanceof Float32Array) ||
            (value instanceof Float64Array) ||
            (value instanceof DataView)) {
          if (value.byteLength === 0) continue;
          this._write(fd => fdwrite(fd, new Uint8Array(value.buffer, value.byteOffset, value.byteLength)));
          size += value.byteLength;
        } else if (value instanceof VBlob) {
          if (value._size === 0) continue;
          this._write(fd => fdwriteFile(fd, value._path));
          size += value._size;
        } else {
          const str = value + '';
          if (str.length === 0) continue;
          this._write(fd => fdwrite(fd, str));
          size += str.length;
        }
      }
      this._writeEnd();
      this._size = size;
    }
  }

  get size(): number {
    return this._size;
  }

  get type(): string {
    return this._type;
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    if (!start) start = 0;
    else if (start < 0) start = this._size + start;
    if (!end) end = this._size;

    if (end < 0) end = this._size - end;
    else if (end >= this._size) end = this._size;
    if (start >= end) return new VBlob([]);

    const newblob = new VBlob();
    newblob._type = contentType || this._type;
    newblob._writeTask = this._writeTask;
    newblob._offset = this._offset + start;
    newblob._size = end - start;
    this._writeTask.then(() => newblob._path = this._path);
    return newblob;
  }

  readBuffer(fd: number): Promise<ArrayBuffer> {
    return fdread(fd, this._size, this._offset).then(buffer => buffer.buffer);
  }
}

export var Blob: { new(array?: any[], options?: BlobPropertyBag): Blob; } = global['Blob'] || VBlob;

class VFileReader extends EventTarget implements FileReader {
  private _readyState: 0 | 1 | 2;
  private _workCount = 0;
  private _abort: ((nullv: null) => void) | null = null;
  private _abortPromise: Promise<null> | null = null;

  public result: any;
  public error: Error;

  constructor() {
    super();
    this._readyState = 0;
  }

  get readyState(): 0 | 1 | 2 {
    return this._readyState;
  }

  abort(): void {
    this._readyState = 2;
    if (this._abort) {
      this._abort(null);
      this._abort = null;
      this._abortPromise = null;
    }
    this.dispatchEvent({type: 'abort'});
  }

  private async _readBuffer(blob: VBlob, cb: (buffer: Buffer) => any): Promise<void> {
    var data: Buffer | null | undefined;
    try {
      if (this._workCount === 0) {
        this.dispatchEvent({type: 'loadstart'});
      }
      this._workCount++;
      if (blob._size === 0) {
        data = Buffer.alloc(0);
        this.result = cb(data);
        this.dispatchEvent({type: 'load'});
        return;
      }
      this._readyState = 1;
      if (!this._abortPromise) {
        this._abortPromise = new Promise<null>(resolve => {
          this._abort = resolve;
        });
      }
      data = await Promise.race([this._abortPromise, (async () => {
        await blob._writeTask;
        const fd = await fdopen(blob._path, 'r');
        try {
          return await fdread(fd, blob._size, blob._offset);
        } finally {
          fdclose(fd);
        }
      })()]);

      if (data) {
        this.result = cb(data);
        this.dispatchEvent({type: 'load'});
      }
    } catch (err) {
      this.error = err;
      this.dispatchEvent({type: 'error', message: err ? err.message : "Error"});
    } finally {
      this._readyState = 2;
      this._workCount--;
      if (this._workCount === 0) {
        if (data !== null) {
          this.dispatchEvent({type: 'loadend'});
        }
      }
    }
  }

  readAsArrayBuffer(blob: Blob): void {
    if (!(blob instanceof VBlob)) throw Error('Only for VBlob');
    this._readBuffer(blob, data => data.buffer);
  }

  readAsBinaryString(blob: Blob): void {
    if (!(blob instanceof VBlob)) throw Error('Only for VBlob');
    this._readBuffer(blob, data => data.toString('binary'));
  }

  readAsDataURL(blob: Blob): void {
    if (!(blob instanceof VBlob)) throw Error('Only for VBlob');
    this._readBuffer(blob, data => "data:" + blob._type + ";base64," + data.toString('base64'));
  }

  readAsText(blob: Blob): void {
    if (!(blob instanceof VBlob)) throw Error('Only for VBlob');
    this._readBuffer(blob, data => data.toString());
  }
}

export var FileReader: { new(): FileReader; } = global['FileReader'] || VFileReader;
