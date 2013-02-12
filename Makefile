PACKAGE = breakupjs
NODEJS = $(if $(shell test -f /usr/bin/nodejs && echo "true"),nodejs,node)
CWD := $(shell pwd)
NODEUNIT = $(CWD)/node_modules/nodeunit/bin/nodeunit
UGLIFY = $(CWD)/node_modules/uglify-js/bin/uglifyjs
JSHINT = $(NODEJS) $(CWD)/node_modules/jshint/bin/hint

BUILDDIR = dist

all: clean test build

build: $(wildcard lib/*.js)
    mkdir -p $(BUILDDIR)
    $(UGLIFY) lib/breakup.js > $(BUILDDIR)/breakup.min.js

test:
    $(NODEUNIT) test

clean:
    rm -rf $(BUILDDIR)

lint:
    $(JSHINT) lib/breakup.js

.PHONY: test build all
