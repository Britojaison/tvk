import urllib.request
import json
import sys

key = "AIzaSyCv6kz_j8rrlLylFZC_hDLTbblYoMYzwBw"

results = {}

# v1beta models
try:
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        v1beta = []
        for m in data.get('models', []):
            if 'image' in m['name'].lower() or 'gemini-2.0' in m['name'].lower():
                v1beta.append({"name": m['name'], "methods": m.get('supportedGenerationMethods', [])})
        results['v1beta'] = v1beta
except Exception as e:
    results['v1beta_error'] = str(e)


# v1alpha models
try:
    url = f"https://generativelanguage.googleapis.com/v1alpha/models?key={key}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        v1alpha = []
        for m in data.get('models', []):
            if 'image' in m['name'].lower() or 'gemini-2.0' in m['name'].lower():
                v1alpha.append({"name": m['name'], "methods": m.get('supportedGenerationMethods', [])})
        results['v1alpha'] = v1alpha
except Exception as e:
    results['v1alpha_error'] = str(e)

with open('models.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
