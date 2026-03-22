import urllib.request, json, urllib.error
try:
    req = urllib.request.Request(
        'http://127.0.0.1:5000/api/students',
        data=json.dumps({'name': 'test', 'register_number': 'TEST5', 'course': 'BCA'}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    urllib.request.urlopen(req)
    print("Success")
except urllib.error.HTTPError as e:
    print("HTTP ", e.code)
    print(e.read().decode())
except Exception as e:
    print(e)
