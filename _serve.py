#!/usr/bin/env python3
"""Local preview server with HTTP Range support.

`python3 -m http.server` ignores Range requests, and Safari refuses to play
<audio>/<video> from a server that can't answer them. GitHub Pages handles
ranges, so this is only for previewing locally:

    python3 _serve.py        ->  http://localhost:8000
"""
import os, re, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class RangeHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.js': 'text/javascript'}

    def send_head(self):
        rng = self.headers.get('Range')
        path = self.translate_path(self.path)
        if not rng or os.path.isdir(path) or not os.path.exists(path):
            return super().send_head()
        m = re.match(r'bytes=(\d*)-(\d*)$', rng.strip())
        size = os.path.getsize(path)
        if not m:
            self.send_error(416); return None
        a, b = m.groups()
        if a == '':  # suffix range: last N bytes
            start, end = max(0, size - int(b)), size - 1
        else:
            start, end = int(a), (int(b) if b else size - 1)
        end = min(end, size - 1)
        if start > end:
            self.send_response(416); self.send_header('Content-Range', f'bytes */{size}'); self.end_headers(); return None
        f = open(path, 'rb'); f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        self._remaining = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        left = getattr(self, '_remaining', None)
        if left is None:
            return super().copyfile(source, outputfile)
        try:
            while left > 0:
                chunk = source.read(min(64 * 1024, left))
                if not chunk: break
                outputfile.write(chunk); left -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass  # browser cancelled a range (normal when seeking)
        finally:
            self._remaining = None

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-store')  # always serve the latest edits
        super().end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f'Serving on http://localhost:{port}  (Ctrl+C to stop)')
    ThreadingHTTPServer(('', port), RangeHandler).serve_forever()
