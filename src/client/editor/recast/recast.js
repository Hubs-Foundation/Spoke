const Recast = (function() {
  const _scriptDir = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : undefined;
  return function(Recast) {
    Recast = Recast || {};

    let c;
    c || (c = typeof Recast !== "undefined" ? Recast : {});
    let m = {},
      n;
    for (n in c) c.hasOwnProperty(n) && (m[n] = c[n]);
    c.arguments = [];
    c.thisProgram = "./this.program";
    c.quit = function(a, b) {
      throw b;
    };
    c.preRun = [];
    c.postRun = [];
    let r = "";
    function aa(a) {
      return c.locateFile ? c.locateFile(a, r) : r + a;
    }
    document.currentScript && (r = document.currentScript.src);
    _scriptDir && (r = _scriptDir);
    0 !== r.indexOf("blob:") ? (r = r.substr(0, r.lastIndexOf("/") + 1)) : (r = "");
    c.read = function(a) {
      const b = new XMLHttpRequest();
      b.open("GET", a, !1);
      b.send(null);
      return b.responseText;
    };
    c.readAsync = function(a, b, d) {
      const e = new XMLHttpRequest();
      e.open("GET", a, !0);
      e.responseType = "arraybuffer";
      e.onload = function() {
        200 == e.status || (0 == e.status && e.response) ? b(e.response) : d();
      };
      e.onerror = d;
      e.send(null);
    };
    c.setWindowTitle = function(a) {
      document.title = a;
    };
    let ba =
        c.print ||
        ("undefined" !== typeof console ? console.log.bind(console) : "undefined" !== typeof print ? print : null),
      u =
        c.printErr ||
        ("undefined" !== typeof printErr
          ? printErr
          : ("undefined" !== typeof console && console.warn.bind(console)) || ba);
    for (n in m) m.hasOwnProperty(n) && (c[n] = m[n]);
    m = void 0;
    function ca(a) {
      let b;
      b || (b = 16);
      return Math.ceil(a / b) * b;
    }
    let da = {
        "f64-rem": function(a, b) {
          return a % b;
        },
        debugger: function() {}
      },
      ea = !1;
    function fa(a) {
      let b;
      if (0 === b || !a) return "";
      for (var d = 0, e, f = 0; ; ) {
        e = v[(a + f) >> 0];
        d |= e;
        if (0 == e && !b) break;
        f++;
        if (b && f == b) break;
      }
      b || (b = f);
      e = "";
      if (128 > d) {
        for (; 0 < b; )
          (d = String.fromCharCode.apply(String, v.subarray(a, a + Math.min(b, 1024)))),
            (e = e ? e + d : d),
            (a += 1024),
            (b -= 1024);
        return e;
      }
      return ha(v, a);
    }
    const ia = "undefined" !== typeof TextDecoder ? new TextDecoder("utf8") : void 0;
    function ha(a, b) {
      for (var d = b; a[d]; ) ++d;
      if (16 < d - b && a.subarray && ia) return ia.decode(a.subarray(b, d));
      for (d = ""; ; ) {
        let e = a[b++];
        if (!e) return d;
        if (e & 128) {
          const f = a[b++] & 63;
          if (192 == (e & 224)) d += String.fromCharCode(((e & 31) << 6) | f);
          else {
            const g = a[b++] & 63;
            if (224 == (e & 240)) e = ((e & 15) << 12) | (f << 6) | g;
            else {
              const h = a[b++] & 63;
              if (240 == (e & 248)) e = ((e & 7) << 18) | (f << 12) | (g << 6) | h;
              else {
                const k = a[b++] & 63;
                if (248 == (e & 252)) e = ((e & 3) << 24) | (f << 18) | (g << 12) | (h << 6) | k;
                else {
                  const q = a[b++] & 63;
                  e = ((e & 1) << 30) | (f << 24) | (g << 18) | (h << 12) | (k << 6) | q;
                }
              }
            }
            65536 > e
              ? (d += String.fromCharCode(e))
              : ((e -= 65536), (d += String.fromCharCode(55296 | (e >> 10), 56320 | (e & 1023))));
          }
        } else d += String.fromCharCode(e);
      }
    }

    function ja(a, b, d) {
      const e = v;
      if (0 < d) {
        d = b + d - 1;
        for (let f = 0; f < a.length; ++f) {
          let g = a.charCodeAt(f);
          if (55296 <= g && 57343 >= g) {
            const h = a.charCodeAt(++f);
            g = (65536 + ((g & 1023) << 10)) | (h & 1023);
          }
          if (127 >= g) {
            if (b >= d) break;
            e[b++] = g;
          } else {
            if (2047 >= g) {
              if (b + 1 >= d) break;
              e[b++] = 192 | (g >> 6);
            } else {
              if (65535 >= g) {
                if (b + 2 >= d) break;
                e[b++] = 224 | (g >> 12);
              } else {
                if (2097151 >= g) {
                  if (b + 3 >= d) break;
                  e[b++] = 240 | (g >> 18);
                } else {
                  if (67108863 >= g) {
                    if (b + 4 >= d) break;
                    e[b++] = 248 | (g >> 24);
                  } else {
                    if (b + 5 >= d) break;
                    e[b++] = 252 | (g >> 30);
                    e[b++] = 128 | ((g >> 24) & 63);
                  }
                  e[b++] = 128 | ((g >> 18) & 63);
                }
                e[b++] = 128 | ((g >> 12) & 63);
              }
              e[b++] = 128 | ((g >> 6) & 63);
            }
            e[b++] = 128 | (g & 63);
          }
        }
        e[b] = 0;
      }
    }
    "undefined" !== typeof TextDecoder && new TextDecoder("utf-16le");
    function ka(a, b) {
      0 < a % b && (a += b - (a % b));
      return a;
    }
    let buffer, w, v, la, ma, x, y, na, oa;
    function pa() {
      c.HEAP8 = w = new Int8Array(buffer);
      c.HEAP16 = la = new Int16Array(buffer);
      c.HEAP32 = x = new Int32Array(buffer);
      c.HEAPU8 = v = new Uint8Array(buffer);
      c.HEAPU16 = ma = new Uint16Array(buffer);
      c.HEAPU32 = y = new Uint32Array(buffer);
      c.HEAPF32 = na = new Float32Array(buffer);
      c.HEAPF64 = oa = new Float64Array(buffer);
    }
    let z, A, qa, ra, ta, ua, B;
    z = A = qa = ra = ta = ua = B = 0;
    c.reallocBuffer ||
      (c.reallocBuffer = function(a) {
        try {
          const b = w;
          var d = new ArrayBuffer(a);
          new Int8Array(d).set(b);
        } catch (e) {
          return !1;
        }
        return va(d) ? d : !1;
      });
    let wa;
    try {
      (wa = Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get)),
        wa(new ArrayBuffer(4));
    } catch (a) {
      wa = function(b) {
        return b.byteLength;
      };
    }
    let xa = c.TOTAL_STACK || 5242880,
      C = c.TOTAL_MEMORY || 16777216;
    C < xa && u("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + C + "! (TOTAL_STACK=" + xa + ")");
    c.buffer
      ? (buffer = c.buffer)
      : ("object" === typeof WebAssembly && "function" === typeof WebAssembly.Memory
          ? ((c.wasmMemory = new WebAssembly.Memory({ initial: C / 65536 })), (buffer = c.wasmMemory.buffer))
          : (buffer = new ArrayBuffer(C)),
        (c.buffer = buffer));
    pa();
    function E(a) {
      for (; 0 < a.length; ) {
        const b = a.shift();
        if ("function" == typeof b) b();
        else {
          const d = b.g;
          "number" === typeof d
            ? void 0 === b.f
              ? c.dynCall_v(d)
              : c.dynCall_vi(d, b.f)
            : d(void 0 === b.f ? null : b.f);
        }
      }
    }
    let ya = [],
      za = [],
      Aa = [],
      Ba = [],
      Ca = !1;
    function Da() {
      const a = c.preRun.shift();
      ya.unshift(a);
    }
    let F = 0,
      Ea = null,
      G = null;
    c.preloadedImages = {};
    c.preloadedAudios = {};
    function H(a) {
      return String.prototype.startsWith
        ? a.startsWith("data:application/octet-stream;base64,")
        : 0 === a.indexOf("data:application/octet-stream;base64,");
    }
    (function() {
      function a() {
        try {
          if (c.wasmBinary) return new Uint8Array(c.wasmBinary);
          if (c.readBinary) return c.readBinary(f);
          throw "both async and sync fetching of the wasm failed";
        } catch (D) {
          I(D);
        }
      }

      function b() {
        return c.wasmBinary || "function" !== typeof fetch
          ? new Promise(function(b) {
              b(a());
            })
          : fetch(f, { credentials: "same-origin" })
              .then(function(a) {
                if (!a.ok) throw "failed to load wasm binary file at '" + f + "'";
                return a.arrayBuffer();
              })
              .catch(function() {
                return a();
              });
      }

      function d(a) {
        function d(a) {
          k = a.exports;
          if (k.memory) {
            a = k.memory;
            let b = c.buffer;
            a.byteLength < b.byteLength &&
              u(
                "the new buffer in mergeMemory is smaller than the previous one. in native wasm, we should grow memory here"
              );
            b = new Int8Array(b);
            new Int8Array(a).set(b);
            c.buffer = buffer = a;
            pa();
          }
          c.asm = k;
          c.usingWasm = !0;
          F--;
          c.monitorRunDependencies && c.monitorRunDependencies(F);
          0 == F && (null !== Ea && (clearInterval(Ea), (Ea = null)), G && ((a = G), (G = null), a()));
        }

        function e(a) {
          d(a.instance);
        }

        function g(a) {
          b()
            .then(function(a) {
              return WebAssembly.instantiate(a, h);
            })
            .then(a)
            .catch(function(a) {
              u("failed to asynchronously prepare wasm: " + a);
              I(a);
            });
        }
        if ("object" !== typeof WebAssembly) return u("no native wasm support detected"), !1;
        if (!(c.wasmMemory instanceof WebAssembly.Memory)) return u("no native wasm Memory in use"), !1;
        a.memory = c.wasmMemory;
        h.global = { NaN: NaN, Infinity: Infinity };
        h["global.Math"] = Math;
        h.env = a;
        F++;
        c.monitorRunDependencies && c.monitorRunDependencies(F);
        if (c.instantiateWasm)
          try {
            return c.instantiateWasm(h, d);
          } catch (l) {
            return u("Module.instantiateWasm callback failed with error: " + l), !1;
          }
        c.wasmBinary || "function" !== typeof WebAssembly.instantiateStreaming || H(f) || "function" !== typeof fetch
          ? g(e)
          : WebAssembly.instantiateStreaming(fetch(f, { credentials: "same-origin" }), h)
              .then(e)
              .catch(function(a) {
                u("wasm streaming compile failed: " + a);
                u("falling back to ArrayBuffer instantiation");
                g(e);
              });
        return {};
      }
      var e = "recast.wast",
        f = "recast.wasm",
        g = "recast.temp.asm.js";
      H(e) || (e = aa(e));
      H(f) || (f = aa(f));
      H(g) || (g = aa(g));
      var h = { global: null, env: null, asm2wasm: da, parent: c },
        k = null;
      c.asmPreload = c.asm;
      const q = c.reallocBuffer;
      c.reallocBuffer = function(a) {
        if ("asmjs" === p) var b = q(a);
        else
          a: {
            a = ka(a, c.usingWasm ? 65536 : 16777216);
            const d = c.buffer.byteLength;
            if (c.usingWasm)
              try {
                b = -1 !== c.wasmMemory.grow((a - d) / 65536) ? (c.buffer = c.wasmMemory.buffer) : null;
                break a;
              } catch (R) {
                b = null;
                break a;
              }
            b = void 0;
          }
        return b;
      };
      var p = "";
      c.asm = function(a, b) {
        if (!b.table) {
          a = c.wasmTableSize;
          void 0 === a && (a = 1024);
          const e = c.wasmMaxTableSize;
          b.table =
            "object" === typeof WebAssembly && "function" === typeof WebAssembly.Table
              ? void 0 !== e
                ? new WebAssembly.Table({ initial: a, maximum: e, element: "anyfunc" })
                : new WebAssembly.Table({ initial: a, element: "anyfunc" })
              : Array(a);
          c.wasmTable = b.table;
        }
        b.memoryBase || (b.memoryBase = c.STATIC_BASE);
        b.tableBase || (b.tableBase = 0);
        (b = d(b)) || I("Assertion failed: no binaryen method succeeded.");
        return b;
      };
    })();
    z = 1024;
    A = z + 277280;
    za.push(
      {
        g: function() {
          Fa();
        }
      },
      {
        g: function() {
          Ga();
        }
      },
      {
        g: function() {
          Ha();
        }
      }
    );
    c.STATIC_BASE = z;
    c.STATIC_BUMP = 277280;
    A += 16;
    function K() {
      return !!K.b;
    }
    let L = 0;
    function M() {
      L += 4;
      return x[(L - 4) >> 2];
    }
    const Ia = {};
    function N(a, b) {
      L = b;
      try {
        let d = M(),
          e = M(),
          f = M();
        a = 0;
        N.b ||
          ((N.b = [null, [], []]),
          (N.s = function(a, b) {
            const d = N.b[a];
            d || I("Assertion failed: undefined");
            0 === b || 10 === b ? ((1 === a ? ba : u)(ha(d, 0)), (d.length = 0)) : d.push(b);
          }));
        for (b = 0; b < f; b++) {
          for (var g = x[(e + 8 * b) >> 2], h = x[(e + (8 * b + 4)) >> 2], k = 0; k < h; k++) N.s(d, v[g + k]);
          a += h;
        }
        return a;
      } catch (q) {
        return ("undefined" !== typeof FS && q instanceof FS.i) || I(q), -q.j;
      }
    }

    function Ja(a) {
      switch (a) {
        case 1:
          return 0;
        case 2:
          return 1;
        case 4:
          return 2;
        case 8:
          return 3;
        default:
          throw new TypeError("Unknown type size: " + a);
      }
    }
    let Ka = void 0;
    function P(a) {
      for (var b = ""; v[a]; ) b += Ka[v[a++]];
      return b;
    }
    let Q = {},
      S = {},
      T = {};
    function La(a) {
      if (void 0 === a) return "_unknown";
      a = a.replace(/[^a-zA-Z0-9_]/g, "$");
      const b = a.charCodeAt(0);
      return 48 <= b && 57 >= b ? "_" + a : a;
    }

    function Ma(a, b) {
      a = La(a);
      return new Function(
        "body",
        "return function " + a + '() {\n    "use strict";    return body.apply(this, arguments);\n};\n'
      )(b);
    }

    function Oa(a) {
      let b = Error,
        d = Ma(a, function(b) {
          this.name = a;
          this.message = b;
          b = Error(b).stack;
          void 0 !== b && (this.stack = this.toString() + "\n" + b.replace(/^Error(:[^\n]*)?\n/, ""));
        });
      d.prototype = Object.create(b.prototype);
      d.prototype.constructor = d;
      d.prototype.toString = function() {
        return void 0 === this.message ? this.name : this.name + ": " + this.message;
      };
      return d;
    }
    let Pa = void 0;
    function U(a) {
      throw new Pa(a);
    }
    let Qa = void 0;
    function Ra(a, b) {
      const d = [];
      function e(a) {
        a = b(a);
        if (a.length !== d.length) throw new Qa("Mismatched type converter count");
        for (let e = 0; e < d.length; ++e) V(d[e], a[e]);
      }
      d.forEach(function(b) {
        T[b] = a;
      });
      let f = Array(a.length),
        g = [],
        h = 0;
      a.forEach(function(a, b) {
        S.hasOwnProperty(a)
          ? (f[b] = S[a])
          : (g.push(a),
            Q.hasOwnProperty(a) || (Q[a] = []),
            Q[a].push(function() {
              f[b] = S[a];
              ++h;
              h === g.length && e(f);
            }));
      });
      0 === g.length && e(f);
    }

    function V(a, b, d) {
      d = d || {};
      if (!("argPackAdvance" in b)) throw new TypeError("registerType registeredInstance requires argPackAdvance");
      const e = b.name;
      a || U('type "' + e + '" must have a positive integer typeid pointer');
      if (S.hasOwnProperty(a)) {
        if (d.w) return;
        U("Cannot register type '" + e + "' twice");
      }
      S[a] = b;
      delete T[a];
      Q.hasOwnProperty(a) &&
        ((b = Q[a]),
        delete Q[a],
        b.forEach(function(a) {
          a();
        }));
    }
    let Sa = [],
      W = [{}, { value: void 0 }, { value: null }, { value: !0 }, { value: !1 }];
    function Ta(a) {
      4 < a && 0 === --W[a].h && ((W[a] = void 0), Sa.push(a));
    }

    function X(a) {
      switch (a) {
        case void 0:
          return 1;
        case null:
          return 2;
        case !0:
          return 3;
        case !1:
          return 4;
        default:
          var b = Sa.length ? Sa.pop() : W.length;
          W[b] = { h: 1, value: a };
          return b;
      }
    }

    function Ua(a) {
      return this.fromWireType(y[a >> 2]);
    }

    function Va(a) {
      if (null === a) return "null";
      const b = typeof a;
      return "object" === b || "array" === b || "function" === b ? a.toString() : "" + a;
    }

    function Wa(a, b) {
      switch (b) {
        case 2:
          return function(a) {
            return this.fromWireType(na[a >> 2]);
          };
        case 3:
          return function(a) {
            return this.fromWireType(oa[a >> 3]);
          };
        default:
          throw new TypeError("Unknown float type: " + a);
      }
    }

    function Xa(a) {
      const b = Function;
      if (!(b instanceof Function))
        throw new TypeError("new_ called with constructor type " + typeof b + " which is not a function");
      let d = Ma(b.name || "unknownFunctionName", function() {});
      d.prototype = b.prototype;
      d = new d();
      a = b.apply(d, a);
      return a instanceof Object ? a : d;
    }

    function Za(a) {
      for (; a.length; ) {
        const b = a.pop();
        a.pop()(b);
      }
    }

    function $a(a, b) {
      const d = c;
      if (void 0 === d[a].a) {
        const e = d[a];
        d[a] = function() {
          d[a].a.hasOwnProperty(arguments.length) ||
            U(
              "Function '" +
                b +
                "' called with an invalid number of arguments (" +
                arguments.length +
                ") - expects one of (" +
                d[a].a +
                ")!"
            );
          return d[a].a[arguments.length].apply(this, arguments);
        };
        d[a].a = [];
        d[a].a[e.l] = e;
      }
    }

    function ab(a, b, d) {
      c.hasOwnProperty(a)
        ? ((void 0 === d || (void 0 !== c[a].a && void 0 !== c[a].a[d])) &&
            U("Cannot register public name '" + a + "' twice"),
          $a(a, a),
          c.hasOwnProperty(d) &&
            U("Cannot register multiple overloads of a function with the same number of arguments (" + d + ")!"),
          (c[a].a[d] = b))
        : ((c[a] = b), void 0 !== d && (c[a].C = d));
    }

    function bb(a, b) {
      for (var d = [], e = 0; e < a; e++) d.push(x[(b >> 2) + e]);
      return d;
    }

    function cb(a, b) {
      a = P(a);
      if (void 0 !== c["FUNCTION_TABLE_" + a]) var d = c["FUNCTION_TABLE_" + a][b];
      else if ("undefined" !== typeof FUNCTION_TABLE) d = FUNCTION_TABLE[b];
      else {
        d = c.asm["dynCall_" + a];
        void 0 === d &&
          ((d = c.asm["dynCall_" + a.replace(/f/g, "d")]), void 0 === d && U("No dynCall invoker for signature: " + a));
        for (var e = [], f = 1; f < a.length; ++f) e.push("a" + f);
        f = "return function " + ("dynCall_" + a + "_" + b) + "(" + e.join(", ") + ") {\n";
        f += "    return dynCall(rawFunction" + (e.length ? ", " : "") + e.join(", ") + ");\n";
        d = new Function("dynCall", "rawFunction", f + "};\n")(d, b);
      }
      "function" !== typeof d && U("unknown function pointer with signature " + a + ": " + b);
      return d;
    }
    let db = void 0;
    function eb(a) {
      a = fb(a);
      const b = P(a);
      Y(a);
      return b;
    }

    function gb(a, b) {
      function d(a) {
        f[a] || S[a] || (T[a] ? T[a].forEach(d) : (e.push(a), (f[a] = !0)));
      }
      var e = [],
        f = {};
      b.forEach(d);
      throw new db(a + ": " + e.map(eb).join([", "]));
    }

    function hb(a, b, d) {
      switch (b) {
        case 0:
          return d
            ? function(a) {
                return w[a];
              }
            : function(a) {
                return v[a];
              };
        case 1:
          return d
            ? function(a) {
                return la[a >> 1];
              }
            : function(a) {
                return ma[a >> 1];
              };
        case 2:
          return d
            ? function(a) {
                return x[a >> 2];
              }
            : function(a) {
                return y[a >> 2];
              };
        default:
          throw new TypeError("Unknown integer type: " + a);
      }
    }

    function ib(a) {
      a || U("Cannot use deleted val. handle = " + a);
      return W[a].value;
    }

    function jb(a, b) {
      const d = S[a];
      void 0 === d && U(b + " has unknown type " + eb(a));
      return d;
    }
    let kb = {},
      lb = {},
      mb = 1;
    function Z(a, b) {
      Z.b || (Z.b = {});
      a in Z.b || (c.dynCall_v(b), (Z.b[a] = 1));
    }
    for (var nb = Array(256), ob = 0; 256 > ob; ++ob) nb[ob] = String.fromCharCode(ob);
    Ka = nb;
    Pa = c.BindingError = Oa("BindingError");
    Qa = c.InternalError = Oa("InternalError");
    c.count_emval_handles = function() {
      for (var a = 0, b = 5; b < W.length; ++b) void 0 !== W[b] && ++a;
      return a;
    };
    c.get_first_emval = function() {
      for (let a = 5; a < W.length; ++a) if (void 0 !== W[a]) return W[a];
      return null;
    };
    db = c.UnboundTypeError = Oa("UnboundTypeError");
    const pb = A;
    A = (A + 4 + 15) & -16;
    B = pb;
    qa = ra = ca(A);
    ta = qa + xa;
    ua = ca(ta);
    x[B >> 2] = ua;
    c.wasmTableSize = 86;
    c.wasmMaxTableSize = 86;
    c.m = {};
    c.o = {
      abort: I,
      enlargeMemory: function() {
        let a = c.usingWasm ? 65536 : 16777216,
          b = 2147483648 - a;
        if (x[B >> 2] > b) return !1;
        const d = C;
        for (C = Math.max(C, 16777216); C < x[B >> 2]; )
          536870912 >= C ? (C = ka(2 * C, a)) : (C = Math.min(ka((3 * C + 2147483648) / 4, a), b));
        a = c.reallocBuffer(C);
        if (!a || a.byteLength != C) return (C = d), !1;
        c.buffer = buffer = a;
        pa();
        return !0;
      },
      getTotalMemory: function() {
        return C;
      },
      abortOnCannotGrowMemory: function() {
        I(
          "Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " +
            C +
            ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 "
        );
      },
      ___assert_fail: function(a, b, d, e) {
        I(
          "Assertion failed: " + fa(a) + ", at: " + [b ? fa(b) : "unknown filename", d, e ? fa(e) : "unknown function"]
        );
      },
      ___cxa_allocate_exception: function(a) {
        return qb(a);
      },
      ___cxa_throw: function(a) {
        "uncaught_exception" in K ? K.b++ : (K.b = 1);
        throw a +
          " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
      },
      ___setErrNo: function(a) {
        c.___errno_location && (x[c.___errno_location() >> 2] = a);
        return a;
      },
      ___syscall140: function(a, b) {
        L = b;
        try {
          const d = Ia.u();
          M();
          let e = M(),
            f = M(),
            g = M();
          FS.B(d, e, g);
          x[f >> 2] = d.position;
          d.v && 0 === e && 0 === g && (d.v = null);
          return 0;
        } catch (h) {
          return ("undefined" !== typeof FS && h instanceof FS.i) || I(h), -h.j;
        }
      },
      ___syscall146: N,
      ___syscall54: function(a, b) {
        L = b;
        return 0;
      },
      ___syscall6: function(a, b) {
        L = b;
        try {
          const d = Ia.u();
          FS.close(d);
          return 0;
        } catch (e) {
          return ("undefined" !== typeof FS && e instanceof FS.i) || I(e), -e.j;
        }
      },
      __embind_register_bool: function(a, b, d, e, f) {
        const g = Ja(d);
        b = P(b);
        V(a, {
          name: b,
          fromWireType: function(a) {
            return !!a;
          },
          toWireType: function(a, b) {
            return b ? e : f;
          },
          argPackAdvance: 8,
          readValueFromPointer: function(a) {
            if (1 === d) var e = w;
            else if (2 === d) e = la;
            else if (4 === d) e = x;
            else throw new TypeError("Unknown boolean type size: " + b);
            return this.fromWireType(e[a >> g]);
          },
          c: null
        });
      },
      __embind_register_emval: function(a, b) {
        b = P(b);
        V(a, {
          name: b,
          fromWireType: function(a) {
            const b = W[a].value;
            Ta(a);
            return b;
          },
          toWireType: function(a, b) {
            return X(b);
          },
          argPackAdvance: 8,
          readValueFromPointer: Ua,
          c: null
        });
      },
      __embind_register_float: function(a, b, d) {
        d = Ja(d);
        b = P(b);
        V(a, {
          name: b,
          fromWireType: function(a) {
            return a;
          },
          toWireType: function(a, b) {
            if ("number" !== typeof b && "boolean" !== typeof b)
              throw new TypeError('Cannot convert "' + Va(b) + '" to ' + this.name);
            return b;
          },
          argPackAdvance: 8,
          readValueFromPointer: Wa(b, d),
          c: null
        });
      },
      __embind_register_function: function(a, b, d, e, f, g) {
        const h = bb(b, d);
        a = P(a);
        f = cb(e, f);
        ab(
          a,
          function() {
            gb("Cannot call " + a + " due to unbound types", h);
          },
          b - 1
        );
        Ra(h, function(d) {
          let e = [d[0], null].concat(d.slice(1)),
            h = (d = a),
            k = f,
            t = e.length;
          2 > t && U("argTypes array size mismatch! Must at least get return value and 'this' types!");
          for (var sa = null !== e[1] && !1, R = !1, l = 1; l < e.length; ++l)
            if (null !== e[l] && void 0 === e[l].c) {
              R = !0;
              break;
            }
          let Na = "void" !== e[0].name,
            J = "",
            O = "";
          for (l = 0; l < t - 2; ++l)
            (J += (0 !== l ? ", " : "") + "arg" + l), (O += (0 !== l ? ", " : "") + "arg" + l + "Wired");
          h =
            "return function " +
            La(h) +
            "(" +
            J +
            ") {\nif (arguments.length !== " +
            (t - 2) +
            ") {\nthrowBindingError('function " +
            h +
            " called with ' + arguments.length + ' arguments, expected " +
            (t - 2) +
            " args!');\n}\n";
          R && (h += "var destructors = [];\n");
          const Ya = R ? "destructors" : "null";
          J = "throwBindingError invoker fn runDestructors retType classParam".split(" ");
          k = [U, k, g, Za, e[0], e[1]];
          sa && (h += "var thisWired = classParam.toWireType(" + Ya + ", this);\n");
          for (l = 0; l < t - 2; ++l)
            (h +=
              "var arg" +
              l +
              "Wired = argType" +
              l +
              ".toWireType(" +
              Ya +
              ", arg" +
              l +
              "); // " +
              e[l + 2].name +
              "\n"),
              J.push("argType" + l),
              k.push(e[l + 2]);
          sa && (O = "thisWired" + (0 < O.length ? ", " : "") + O);
          h += (Na ? "var rv = " : "") + "invoker(fn" + (0 < O.length ? ", " : "") + O + ");\n";
          if (R) h += "runDestructors(destructors);\n";
          else
            for (l = sa ? 1 : 2; l < e.length; ++l)
              (t = 1 === l ? "thisWired" : "arg" + (l - 2) + "Wired"),
                null !== e[l].c &&
                  ((h += t + "_dtor(" + t + "); // " + e[l].name + "\n"), J.push(t + "_dtor"), k.push(e[l].c));
          Na && (h += "var ret = retType.fromWireType(rv);\nreturn ret;\n");
          J.push(h + "}\n");
          e = Xa(J).apply(null, k);
          l = b - 1;
          if (!c.hasOwnProperty(d)) throw new Qa("Replacing nonexistant public symbol");
          void 0 !== c[d].a && void 0 !== l ? (c[d].a[l] = e) : ((c[d] = e), (c[d].l = l));
          return [];
        });
      },
      __embind_register_integer: function(a, b, d, e, f) {
        function g(a) {
          return a;
        }
        b = P(b);
        -1 === f && (f = 4294967295);
        const h = Ja(d);
        if (0 === e) {
          const k = 32 - 8 * d;
          g = function(a) {
            return (a << k) >>> k;
          };
        }
        const q = -1 != b.indexOf("unsigned");
        V(a, {
          name: b,
          fromWireType: g,
          toWireType: function(a, d) {
            if ("number" !== typeof d && "boolean" !== typeof d)
              throw new TypeError('Cannot convert "' + Va(d) + '" to ' + this.name);
            if (d < e || d > f)
              throw new TypeError(
                'Passing a number "' +
                  Va(d) +
                  '" from JS side to C/C++ side to an argument of type "' +
                  b +
                  '", which is outside the valid range [' +
                  e +
                  ", " +
                  f +
                  "]!"
              );
            return q ? d >>> 0 : d | 0;
          },
          argPackAdvance: 8,
          readValueFromPointer: hb(b, h, 0 !== e),
          c: null
        });
      },
      __embind_register_memory_view: function(a, b, d) {
        function e(a) {
          a >>= 2;
          const b = y;
          return new f(b.buffer, b[a + 1], b[a]);
        }
        var f = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array][
          b
        ];
        d = P(d);
        V(a, { name: d, fromWireType: e, argPackAdvance: 8, readValueFromPointer: e }, { w: !0 });
      },
      __embind_register_std_string: function(a, b) {
        b = P(b);
        const d = "std::string" === b;
        V(a, {
          name: b,
          fromWireType: function(a) {
            const b = y[a >> 2];
            if (d) {
              var e = v[a + 4 + b],
                h = 0;
              0 != e && ((h = e), (v[a + 4 + b] = 0));
              let k = a + 4;
              for (e = 0; e <= b; ++e) {
                const q = a + 4 + e;
                if (0 == v[q]) {
                  k = ha(v, k);
                  if (void 0 === p) var p = k;
                  else (p += String.fromCharCode(0)), (p += k);
                  k = q + 1;
                }
              }
              0 != h && (v[a + 4 + b] = h);
            } else {
              p = Array(b);
              for (e = 0; e < b; ++e) p[e] = String.fromCharCode(v[a + 4 + e]);
              p = p.join("");
            }
            Y(a);
            return p;
          },
          toWireType: function(a, b) {
            b instanceof ArrayBuffer && (b = new Uint8Array(b));
            let e = "string" === typeof b;
            e ||
              b instanceof Uint8Array ||
              b instanceof Uint8ClampedArray ||
              b instanceof Int8Array ||
              U("Cannot pass non-string to std::string");
            let f = (d && e
                ? function() {
                    for (var a = 0, e = 0; e < b.length; ++e) {
                      let d = b.charCodeAt(e);
                      55296 <= d && 57343 >= d && (d = (65536 + ((d & 1023) << 10)) | (b.charCodeAt(++e) & 1023));
                      127 >= d
                        ? ++a
                        : (a =
                            2047 >= d
                              ? a + 2
                              : 65535 >= d
                                ? a + 3
                                : 2097151 >= d
                                  ? a + 4
                                  : 67108863 >= d
                                    ? a + 5
                                    : a + 6);
                    }
                    return a;
                  }
                : function() {
                    return b.length;
                  })(),
              k = qb(4 + f + 1);
            y[k >> 2] = f;
            if (d && e) ja(b, k + 4, f + 1);
            else if (e)
              for (e = 0; e < f; ++e) {
                const q = b.charCodeAt(e);
                255 < q && (Y(k), U("String has UTF-16 code units that do not fit in 8 bits"));
                v[k + 4 + e] = q;
              }
            else for (e = 0; e < f; ++e) v[k + 4 + e] = b[e];
            null !== a && a.push(Y, k);
            return k;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ua,
          c: function(a) {
            Y(a);
          }
        });
      },
      __embind_register_std_wstring: function(a, b, d) {
        d = P(d);
        if (2 === b) {
          var e = function() {
            return ma;
          };
          var f = 1;
        } else
          4 === b &&
            ((e = function() {
              return y;
            }),
            (f = 2));
        V(a, {
          name: d,
          fromWireType: function(a) {
            for (var b = e(), d = y[a >> 2], g = Array(d), p = (a + 4) >> f, D = 0; D < d; ++D)
              g[D] = String.fromCharCode(b[p + D]);
            Y(a);
            return g.join("");
          },
          toWireType: function(a, d) {
            let g = e(),
              h = d.length,
              p = qb(4 + h * b);
            y[p >> 2] = h;
            for (let D = (p + 4) >> f, t = 0; t < h; ++t) g[D + t] = d.charCodeAt(t);
            null !== a && a.push(Y, p);
            return p;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ua,
          c: function(a) {
            Y(a);
          }
        });
      },
      __embind_register_void: function(a, b) {
        b = P(b);
        V(a, { A: !0, name: b, argPackAdvance: 0, fromWireType: function() {}, toWireType: function() {} });
      },
      __emval_as: function(a, b, d) {
        a = ib(a);
        b = jb(b, "emval::as");
        let e = [],
          f = X(e);
        x[d >> 2] = f;
        return b.toWireType(e, a);
      },
      __emval_decref: Ta,
      __emval_get_property: function(a, b) {
        a = ib(a);
        b = ib(b);
        return X(a[b]);
      },
      __emval_incref: function(a) {
        4 < a && (W[a].h += 1);
      },
      __emval_new_cstring: function(a) {
        const b = kb[a];
        return X(void 0 === b ? P(a) : b);
      },
      __emval_run_destructors: function(a) {
        Za(W[a].value);
        Ta(a);
      },
      __emval_take_value: function(a, b) {
        a = jb(a, "_emval_take_value");
        a = a.readValueFromPointer(b);
        return X(a);
      },
      _abort: function() {
        c.abort();
      },
      _emscripten_memcpy_big: function(a, b, d) {
        v.set(v.subarray(b, b + d), a);
        return a;
      },
      _pthread_getspecific: function(a) {
        return lb[a] || 0;
      },
      _pthread_key_create: function(a) {
        if (0 == a) return 22;
        x[a >> 2] = mb;
        lb[mb] = 0;
        mb++;
        return 0;
      },
      _pthread_once: Z,
      _pthread_setspecific: function(a, b) {
        if (!(a in lb)) return 22;
        lb[a] = b;
        return 0;
      },
      DYNAMICTOP_PTR: B,
      STACKTOP: ra
    };
    const rb = c.asm(c.m, c.o, buffer);
    c.asm = rb;
    var Ha = (c.__GLOBAL__sub_I_bind_cpp = function() {
        return c.asm.__GLOBAL__sub_I_bind_cpp.apply(null, arguments);
      }),
      Fa = (c.__GLOBAL__sub_I_build_cpp = function() {
        return c.asm.__GLOBAL__sub_I_build_cpp.apply(null, arguments);
      }),
      Ga = (c.__GLOBAL__sub_I_port_cpp = function() {
        return c.asm.__GLOBAL__sub_I_port_cpp.apply(null, arguments);
      });
    c.___errno_location = function() {
      return c.asm.___errno_location.apply(null, arguments);
    };
    var fb = (c.___getTypeName = function() {
        return c.asm.___getTypeName.apply(null, arguments);
      }),
      va = (c._emscripten_replace_memory = function() {
        return c.asm._emscripten_replace_memory.apply(null, arguments);
      }),
      Y = (c._free = function() {
        return c.asm._free.apply(null, arguments);
      }),
      qb = (c._malloc = function() {
        return c.asm._malloc.apply(null, arguments);
      });
    c.dynCall_ii = function() {
      return c.asm.dynCall_ii.apply(null, arguments);
    };
    c.dynCall_iifffffffffffff = function() {
      return c.asm.dynCall_iifffffffffffff.apply(null, arguments);
    };
    c.dynCall_iii = function() {
      return c.asm.dynCall_iii.apply(null, arguments);
    };
    c.dynCall_iiii = function() {
      return c.asm.dynCall_iiii.apply(null, arguments);
    };
    c.dynCall_v = function() {
      return c.asm.dynCall_v.apply(null, arguments);
    };
    c.dynCall_vi = function() {
      return c.asm.dynCall_vi.apply(null, arguments);
    };
    c.dynCall_vifffffffffffff = function() {
      return c.asm.dynCall_vifffffffffffff.apply(null, arguments);
    };
    c.dynCall_vii = function() {
      return c.asm.dynCall_vii.apply(null, arguments);
    };
    c.dynCall_viii = function() {
      return c.asm.dynCall_viii.apply(null, arguments);
    };
    c.dynCall_viiii = function() {
      return c.asm.dynCall_viiii.apply(null, arguments);
    };
    c.dynCall_viiiii = function() {
      return c.asm.dynCall_viiiii.apply(null, arguments);
    };
    c.dynCall_viiiiii = function() {
      return c.asm.dynCall_viiiiii.apply(null, arguments);
    };
    c.asm = rb;
    c.then = function(a) {
      if (c.calledRun) a(c);
      else {
        const b = c.onRuntimeInitialized;
        c.onRuntimeInitialized = function() {
          b && b();
          a(c);
        };
      }
      return c;
    };
    G = function sb() {
      c.calledRun || tb();
      c.calledRun || (G = sb);
    };
    function tb() {
      function a() {
        if (!c.calledRun && ((c.calledRun = !0), !ea)) {
          Ca || ((Ca = !0), E(za));
          E(Aa);
          if (c.onRuntimeInitialized) c.onRuntimeInitialized();
          if (c.postRun)
            for ("function" == typeof c.postRun && (c.postRun = [c.postRun]); c.postRun.length; ) {
              const a = c.postRun.shift();
              Ba.unshift(a);
            }
          E(Ba);
        }
      }
      if (!(0 < F)) {
        if (c.preRun) for ("function" == typeof c.preRun && (c.preRun = [c.preRun]); c.preRun.length; ) Da();
        E(ya);
        0 < F ||
          c.calledRun ||
          (c.setStatus
            ? (c.setStatus("Running..."),
              setTimeout(function() {
                setTimeout(function() {
                  c.setStatus("");
                }, 1);
                a();
              }, 1))
            : a());
      }
    }
    c.run = tb;
    function I(a) {
      if (c.onAbort) c.onAbort(a);
      void 0 !== a ? (ba(a), u(a), (a = JSON.stringify(a))) : (a = "");
      ea = !0;
      throw "abort(" + a + "). Build with -s ASSERTIONS=1 for more info.";
    }
    c.abort = I;
    if (c.preInit)
      for ("function" == typeof c.preInit && (c.preInit = [c.preInit]); 0 < c.preInit.length; ) c.preInit.pop()();
    c.noExitRuntime = !0;
    tb();

    return Recast;
  };
})();
if (typeof exports === "object" && typeof module === "object") module.exports = Recast;
else if (typeof define === "function" && define["amd"])
  define([], function() {
    return Recast;
  });
else if (typeof exports === "object") exports["Recast"] = Recast;
