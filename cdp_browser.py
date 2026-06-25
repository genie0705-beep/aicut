#!/usr/bin/env python3
"""CDP browser interaction script for hosting.kr DNS configuration."""

import json
import sys
import time
import websocket

TARGET_ID = "67AFD5E7D5595CD6B47610E115D34AA3"
WS_URL = f"ws://127.0.0.1:9222/devtools/page/{TARGET_ID}"

msg_id = 0

def send(ws, method, params=None):
    global msg_id
    msg_id += 1
    cmd = {"id": msg_id, "method": method}
    if params:
        cmd["params"] = params
    ws.send(json.dumps(cmd))
    return msg_id

def recv(ws, wait_for_id=None):
    """Receive messages, optionally waiting for a specific id."""
    responses = []
    timeout = time.time() + 30
    while time.time() < timeout:
        ws.settimeout(1)
        try:
            data = ws.recv()
            if data:
                msg = json.loads(data)
                responses.append(msg)
                if wait_for_id and msg.get("id") == wait_for_id:
                    return responses
        except websocket.WebSocketTimeoutException:
            if wait_for_id is None:
                break
    return responses

def recv_until(ws, wait_for_id, max_retries=50):
    """Receive until we get a response with the given id."""
    for _ in range(max_retries):
        try:
            ws.settimeout(2)
            data = ws.recv()
            if data:
                msg = json.loads(data)
                if msg.get("id") == wait_for_id:
                    return msg
        except websocket.WebSocketTimeoutException:
            pass
    return None

def wait_for_page_load(ws):
    """Wait for page to finish loading."""
    print("  Waiting for page to load...")
    _, load_id = send(ws, "Page.enable")
    wait = 0
    while wait < 30:
        try:
            ws.settimeout(2)
            data = ws.recv()
            if data:
                msg = json.loads(data)
                if msg.get("method") == "Page.loadEventFired":
                    print("  Page loaded!")
                    return
        except websocket.WebSocketTimeoutException:
            wait += 2
            print(f"  Still waiting... ({wait}s)")

def get_document(ws):
    """Get the document body for DOM operations."""
    _, doc_id = send(ws, "DOM.getDocument", {"depth": 0})
    resp = recv_until(ws, doc_id)
    if resp:
        return resp.get("result", {}).get("root", {}).get("nodeId")
    return None

def query_selector(ws, node_id, selector):
    """Query selector within a node."""
    _, q_id = send(ws, "DOM.querySelector", {"nodeId": node_id, "selector": selector})
    resp = recv_until(ws, q_id)
    if resp and resp.get("result", {}).get("nodeId") and resp["result"]["nodeId"] > 0:
        return resp["result"]["nodeId"]
    return None

def query_selector_all(ws, node_id, selector):
    """Query selector all within a node."""
    _, q_id = send(ws, "DOM.querySelectorAll", {"nodeId": node_id, "selector": selector})
    resp = recv_until(ws, q_id)
    if resp:
        return resp.get("result", {}).get("nodeIds", [])
    return []

def get_outer_html(ws, node_id):
    """Get outer HTML of a node."""
    _, g_id = send(ws, "DOM.getOuterHTML", {"nodeId": node_id})
    resp = recv_until(ws, g_id)
    if resp:
        return resp.get("result", {}).get("outerHTML", "")
    return ""

def click_element(ws, backend_node_id):
    """Click an element by backend node id."""
    _, c_id = send(ws, "Input.dispatchMouseEvent", {
        "type": "mousePressed",
        "button": "left",
        "clickCount": 1,
        "x": 1,
        "y": 1,
        "backendNodeId": backend_node_id
    })
    recv_until(ws, c_id)
    _, r_id = send(ws, "Input.dispatchMouseEvent", {
        "type": "mouseReleased",
        "button": "left",
        "clickCount": 1,
        "x": 1,
        "y": 1,
        "backendNodeId": backend_node_id
    })
    recv_until(ws, r_id)

def get_box_model(ws, node_id):
    """Get the box model (position) of a node."""
    _, b_id = send(ws, "DOM.getBoxModel", {"nodeId": node_id})
    resp = recv_until(ws, b_id)
    if resp and "result" in resp and "model" in resp["result"]:
        return resp["result"]["model"]
    return None

def resolve_node(ws, node_id):
    """Resolve a node to its JS object, returning object id."""
    _, r_id = send(ws, "DOM.resolveNode", {"nodeId": node_id})
    resp = recv_until(ws, r_id)
    if resp and "result" in resp and "object" in resp["result"]:
        return resp["result"]["object"].get("objectId")
    return None

def call_function_on(ws, object_id, fn_declaration, args=None):
    """Call a function on a remote object."""
    params = {
        "functionDeclaration": fn_declaration,
        "objectId": object_id,
        "returnByValue": True
    }
    if args:
        params["arguments"] = args
    _, c_id = send(ws, "Runtime.callFunctionOn", params)
    return recv_until(ws, c_id)

def evaluate(ws, expression):
    """Evaluate JavaScript expression and return result."""
    _, e_id = send(ws, "Runtime.evaluate", {
        "expression": expression,
        "returnByValue": True
    })
    resp = recv_until(ws, e_id)
    if resp:
        return resp.get("result", {}).get("result", {})
    return None

def get_property(ws, object_id, prop_name):
    """Get a property value from a remote object."""
    _, g_id = send(ws, "Runtime.getProperties", {
        "objectId": object_id,
        "ownProperties": True
    })
    resp = recv_until(ws, g_id)
    if resp and "result" in resp:
        for prop in resp["result"].get("result", []):
            if prop.get("name") == prop_name:
                return prop.get("value", {})
    return None

def click_at_viewport(ws, x, y):
    """Click at viewport coordinates."""
    print(f"  Clicking at ({x}, {y})")
    _, c_id = send(ws, "Input.dispatchMouseEvent", {
        "type": "mousePressed",
        "x": x,
        "y": y,
        "button": "left",
        "clickCount": 1
    })
    recv_until(ws, c_id)
    _, r_id = send(ws, "Input.dispatchMouseEvent", {
        "type": "mouseReleased",
        "x": x,
        "y": y,
        "button": "left",
        "clickCount": 1
    })
    recv_until(ws, r_id)

def type_text(ws, text):
    """Type text using keyboard events."""
    for char in text:
        _, c_id = send(ws, "Input.dispatchKeyEvent", {
            "type": "keyDown",
            "text": char,
            "key": char,
            "windowsVirtualKeyCode": ord(char.upper())
        })
        recv_until(ws, c_id)
        _, r_id = send(ws, "Input.dispatchKeyEvent", {
            "type": "keyUp",
            "key": char,
            "windowsVirtualKeyCode": ord(char.upper())
        })
        recv_until(ws, r_id)

def press_enter(ws):
    """Press Enter key."""
    _, c_id = send(ws, "Input.dispatchKeyEvent", {
        "type": "rawKeyDown",
        "key": "Enter",
        "windowsVirtualKeyCode": 13,
        "code": "Enter"
    })
    recv_until(ws, c_id)
    _, r_id = send(ws, "Input.dispatchKeyEvent", {
        "type": "keyUp",
        "key": "Enter",
        "windowsVirtualKeyCode": 13,
        "code": "Enter"
    })
    recv_until(ws, r_id)

def main():
    # Try with suppress_origin to avoid sending Origin header
    ws = websocket.create_connection(WS_URL, suppress_origin=True)
    print("Connected to CDP")

    # Enable necessary domains
    send(ws, "Page.enable")
    send(ws, "DOM.enable")
    send(ws, "Runtime.enable")
    send(ws, "Input.enable")
    time.sleep(1)

    # Check what's on the page
    result = evaluate(ws, "document.title")
    print(f"Page title: {result}")

    # Also enable dialog handling
    send(ws, "Page.enable")
    # Register dialog handler
    send(ws, "Page.setInterceptFileChooserDialog", {"enabled": True})
    # We'll handle dialogs in the recv loop

    # Take screenshot to see what's on the page
    _, s_id = send(ws, "Page.captureScreenshot", {"format": "png"})
    resp = recv_until(ws, s_id)
    if resp and "result" in resp:
        import base64
        img_data = base64.b64decode(resp["result"]["data"])
        with open("dns_page.png", "wb") as f:
            f.write(img_data)
        print("Screenshot saved to dns_page.png")
    
    # Get full page HTML
    result = evaluate(ws, "document.body ? document.body.innerText.substring(0, 5000) : 'No body'")
    if result:
        val = result.get("value", "")
        print(f"Page text content (first 5000 chars):\n{val}")

    # Check if we're logged in by looking for login forms
    result = evaluate(ws, "document.querySelector('input[type=password]') !== null")
    if result:
        print(f"Password field present: {result.get('value')}")

    # Look for DNS table rows
    result = evaluate(ws, """
        (() => {
            const rows = document.querySelectorAll('tr, [class*="row"], [class*="Row"]');
            let info = [];
            rows.forEach((row, i) => {
                const text = row.textContent.trim().substring(0, 200);
                if (text) info.push({idx: i, text: text});
            });
            return JSON.stringify(info.slice(0, 40));
        })()
    """)
    if result:
        print(f"Rows found:\n{result.get('value', '')}")

    # Tell me the URL
    result = evaluate(ws, "window.location.href")
    if result:
        print(f"Current URL: {result.get('value')}")

    ws.close()

if __name__ == "__main__":
    main()
