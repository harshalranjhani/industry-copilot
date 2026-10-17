// shortcut: OpenUI 1.x has no auto-mount opt-out; replace this guard when it exposes one.
Object.defineProperty(globalThis, Symbol.for("openui.devtools.autoMount"), { value: true, configurable: true });
