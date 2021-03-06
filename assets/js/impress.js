/**
 * impress.js
 *
 * Adaptação de impress.js feito por Walter Pereira Mendes Jr.
 *
 *
 * ------------------------------------------------
 */

(function ( document, window ) {
    'use strict';

    
    var pfx = (function () {

        var style = document.createElement('dummy').style,
            prefixes = 'Webkit Moz O ms Khtml'.split(' '),
            memory = {};
            
        return function ( prop ) {
            if ( typeof memory[ prop ] === "undefined" ) {

                var ucProp  = prop.charAt(0).toUpperCase() + prop.substr(1),
                    props   = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');

                memory[ prop ] = null;
                for ( var i in props ) {
                    if ( style[ props[i] ] !== undefined ) {
                        memory[ prop ] = props[i];
                        break;
                    }
                }

            }

            return memory[ prop ];
        }

    })();

    var arrayify = function ( a ) {
        return [].slice.call( a );
    };
    
    var css = function ( el, props ) {
        var key, pkey;
        for ( key in props ) {
            if ( props.hasOwnProperty(key) ) {
                pkey = pfx(key);
                if ( pkey != null ) {
                    el.style[pkey] = props[key];
                }
            }
        }
        return el;
    }
    
    var byId = function ( id ) {
        return document.getElementById(id);
    }
    
    var $ = function ( selector, context ) {
        context = context || document;
        return context.querySelector(selector);
    };
    
    var $$ = function ( selector, context ) {
        context = context || document;
        return arrayify( context.querySelectorAll(selector) );
    };
    
    var translate = function ( t ) {
        return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) ";
    };
    
    var rotate = function ( r, revert ) {
        var rX = " rotateX(" + r.x + "deg) ",
            rY = " rotateY(" + r.y + "deg) ",
            rZ = " rotateZ(" + r.z + "deg) ";
        
        return revert ? rZ+rY+rX : rX+rY+rZ;
    };
    
    var scale = function ( s ) {
        return " scale(" + s + ") ";
    };
    
    var getElementFromUrl = function () {
        return byId( window.location.hash.replace(/^#\/?/,"") );
    };
    
    
    var ua = navigator.userAgent.toLowerCase();
    var impressSupported = ( pfx("perspective") != null ) &&
                           ( document.body.classList ) &&
                           ( document.body.dataset ) &&
                           ( ua.search(/(iphone)|(ipod)|(android)/) == -1 );
    
    var roots = {};
    
    var impress = window.impress = function ( rootId ) {

        rootId = rootId || "impress";
        
        if (roots["impress-root-" + rootId]) {
            return roots["impress-root-" + rootId];
        }
        
        var root = byId( rootId );
        
        if (!impressSupported) {
            root.className = "impress-not-supported";
            return;
        } else {
            root.className = "";
        }
        
        var meta = $("meta[name='viewport']") || document.createElement("meta");
        meta.content = "width=1024, minimum-scale=0.75, maximum-scale=0.75, user-scalable=no";
        if (meta.parentNode != document.head) {
            meta.name = 'viewport';
            document.head.appendChild(meta);
        }
        
        var canvas = document.createElement("div");
        canvas.className = "canvas";
        
        arrayify( root.childNodes ).forEach(function ( el ) {
            canvas.appendChild( el );
        });
        root.appendChild(canvas);
        
        var steps = $$(".step", root);
        
        
        document.documentElement.style.height = "100%";
        
        css(document.body, {
            height: "100%",
            overflow: "hidden"
        });

        var props = {
            position: "absolute",
            transformOrigin: "top left",
            transition: "all 0s ease-in-out",
            transformStyle: "preserve-3d"
        }
        
        css(root, props);
        css(root, {
            top: "50%",
            left: "50%",
            perspective: "1000px"
        });
        css(canvas, props);
        
        var current = {
            translate: { x: 0, y: 0, z: 0 },
            rotate:    { x: 0, y: 0, z: 0 },
            scale:     1
        };

        var stepData = {};
        
        var isStep = function ( el ) {
            return !!(el && el.id && stepData["impress-" + el.id]);
        }
        
        steps.forEach(function ( el, idx ) {
            var data = el.dataset,
                step = {
                    translate: {
                        x: data.x || 0,
                        y: data.y || 0,
                        z: data.z || 0
                    },
                    rotate: {
                        x: data.rotateX || 0,
                        y: data.rotateY || 0,
                        z: data.rotateZ || data.rotate || 0
                    },
                    scale: data.scale || 1,
                    el: el
                };
            
            if ( !el.id ) {
                el.id = "step-" + (idx + 1);
            }
            
            stepData["impress-" + el.id] = step;
            
            css(el, {
                position: "absolute",
                transform: "translate(-50%,-50%)" +
                           translate(step.translate) +
                           rotate(step.rotate) +
                           scale(step.scale),
                transformStyle: "preserve-3d"
            });
            
        });


        var active = null;
        var hashTimeout = null;
        
        var goto = function ( el ) {
            if ( !isStep(el) || el == active) {
                return false;
            }
            
            window.scrollTo(0, 0);
            
            var step = stepData["impress-" + el.id];
            
            if ( active ) {
                active.classList.remove("active");
            }
            el.classList.add("active");
            
            root.className = "step-" + el.id;
			
            window.clearTimeout( hashTimeout );
            hashTimeout = window.setTimeout(function () {
                window.location.hash = "#/" + el.id;
            }, 1000);
            
            var target = {
                rotate: {
                    x: -parseInt(step.rotate.x, 10),
                    y: -parseInt(step.rotate.y, 10),
                    z: -parseInt(step.rotate.z, 10)
                },
                translate: {
                    x: -step.translate.x,
                    y: -step.translate.y,
                    z: -step.translate.z
                },
                scale: 1 / parseFloat(step.scale)
            };
            
            var zoomin = target.scale >= current.scale;
            
            var duration = (active) ? "1s" : "0";
            
            css(root, {
                perspective: step.scale * 1000 + "px",
                transform: scale(target.scale),
                transitionDuration: duration,
                transitionDelay: (zoomin ? "500ms" : "0ms")
            });
            
            css(canvas, {
                transform: rotate(target.rotate, true) + translate(target.translate),
                transitionDuration: duration,
                transitionDelay: (zoomin ? "0ms" : "500ms")
            });
            
            current = target;
            active = el;
            
            return el;
        };
        
        var prev = function () {
            var prev = steps.indexOf( active ) - 1;
            prev = prev >= 0 ? steps[ prev ] : steps[ steps.length-1 ];
            
            return goto(prev);
        };
        
        var next = function () {
            var next = steps.indexOf( active ) + 1;
            next = next < steps.length ? steps[ next ] : steps[ 0 ];
            
            return goto(next);
        };
        
        window.addEventListener("hashchange", function () {
            goto( getElementFromUrl() );
        }, false);
        
        window.addEventListener("orientationchange", function () {
            window.scrollTo(0, 0);
        }, false);
        
        goto(getElementFromUrl() || steps[0]);

        return (roots[ "impress-root-" + rootId ] = {
            goto: goto,
            next: next,
            prev: prev
        });

    }
})(document, window);


(function ( document, window ) {
    'use strict';
    
    document.addEventListener("keydown", function ( event ) {
        if ( event.keyCode == 9 || ( event.keyCode >= 32 && event.keyCode <= 34 ) || (event.keyCode >= 37 && event.keyCode <= 40) ) {
            switch( event.keyCode ) {
                case 33: ; // pg up
                case 37: ; // left
                case 38:   // up
                         impress().prev();
                         break;
                case 9:  ; // tab
                case 32: ; // space
                case 34: ; // pg down
                case 39: ; // right
                case 40:   // down
                         impress().next();
                         break;
            }
            
            event.preventDefault();
        }
    }, false);
    
    document.addEventListener("click", function ( event ) {
        var target = event.target;
        while ( (target.tagName != "A") &&
                (target != document.body) ) {
            target = target.parentNode;
        }
        
        if ( target.tagName == "A" ) {
            var href = target.getAttribute("href");
            
            if ( href && href[0] == '#' ) {
                target = document.getElementById( href.slice(1) );
            }
        }
        
        if ( impress().goto(target) ) {
            event.stopImmediatePropagation();
            event.preventDefault();
        }
    }, false);
    
    document.addEventListener("click", function ( event ) {
        var target = event.target;
        while ( !target.classList.contains("step") &&
                (target != document.body) ) {
            target = target.parentNode;
        }
        
        if ( impress().goto(target) ) {
            event.preventDefault();
        }
    }, false);
    
    document.addEventListener("touchstart", function ( event ) {
        if (event.touches.length === 1) {
            var x = event.touches[0].clientX,
                width = window.innerWidth * 0.3,
                result = null;
                
            if ( x < width ) {
                result = impress().prev();
            } else if ( x > window.innerWidth - width ) {
                result = impress().next();
            }
            
            if (result) {
                event.preventDefault();
            }
        }
    }, false);
})(document, window);

