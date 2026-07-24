from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import base64

class ResHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        filename = data['filename']
        base64_img = data['image'].split(',')[1]
        
        with open(filename, "wb") as fh:
            fh.write(base64.b64decode(base64_img))
            
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b"OK")
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

print("Starting server on 8001")
HTTPServer(('', 8001), ResHandler).serve_forever()
