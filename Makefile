# The Long Range Game, Revisited: data pipeline
# Two-command rebuild:  make venv && make data
PY      := .venv/bin/python
PIP     := .venv/bin/pip
PYTHON3 ?= python3

.PHONY: venv data pull data-browser validate clean-raw build deploy

venv: .venv/bin/python

.venv/bin/python:
	$(PYTHON3) -m venv .venv
	$(PIP) install --upgrade pip >/dev/null
	$(PIP) install -r requirements.txt

data: venv pull validate

pull:
	$(PY) pipeline/pull_shot_locations.py
	$(PY) pipeline/pull_league_pergame.py
	$(PY) pipeline/pull_curry.py

# Build the same three files from stats tables read off www.nba.com/stats pages
# (pipeline/browser/*). Use when stats.nba.com's JSON API will not answer this network.
data-browser: venv
	$(PY) pipeline/build_from_browser.py
	$(PY) pipeline/validate.py

validate:
	$(PY) pipeline/validate.py

build:
	cd site && npm ci && npm run build

deploy: build
	cd site && npx wrangler deploy

clean-raw:
	rm -rf pipeline/raw
