"""Fetch stats.nba.com JSON through a real, headless Google Chrome (Playwright).

stats.nba.com sits behind Akamai, which does not answer plain HTTP clients
from many networks. Loading the endpoint URL in an ordinary Chrome tab and
reading the response body is the simplest transport that works everywhere the
site itself works. One browser is shared across a pull; call close() at the end.
"""
from __future__ import annotations

import json
from typing import Any, Dict, Optional

from common import TIMEOUT, log

_pw = None
_browser = None
_page = None


def _ensure_page():
    global _pw, _browser, _page
    if _page is not None:
        return _page
    from playwright.sync_api import sync_playwright

    _pw = sync_playwright().start()
    # Use the installed Google Chrome; fall back to Playwright's Chromium if absent.
    try:
        _browser = _pw.chromium.launch(channel="chrome", headless=True)
    except Exception as exc:  # noqa: BLE001
        log("  chrome channel unavailable (%s); using bundled chromium" % str(exc)[:80])
        _browser = _pw.chromium.launch(headless=True)
    ctx = _browser.new_context(locale="en-US")
    _page = ctx.new_page()
    _page.set_default_timeout(TIMEOUT * 1000)
    # Land on the stats site once so the normal site cookies exist.
    try:
        _page.goto("https://www.nba.com/stats", wait_until="domcontentloaded")
    except Exception as exc:  # noqa: BLE001
        log("  warm-up visit failed: %s" % str(exc)[:120])
    return _page


def get_json(url: str) -> Dict[str, Any]:
    page = _ensure_page()
    resp = page.goto(url, wait_until="domcontentloaded")
    if resp is None:
        raise RuntimeError("no response for %s" % url)
    if resp.status != 200:
        raise RuntimeError("HTTP %d for %s" % (resp.status, url))
    text: Optional[str] = page.evaluate("() => document.body ? document.body.innerText : ''")
    if not text:
        raise RuntimeError("empty body for %s" % url)
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise RuntimeError("non-JSON body (%s): %s" % (exc, text[:120])) from exc


def close() -> None:
    global _pw, _browser, _page
    try:
        if _browser is not None:
            _browser.close()
        if _pw is not None:
            _pw.stop()
    finally:
        _pw = _browser = _page = None
