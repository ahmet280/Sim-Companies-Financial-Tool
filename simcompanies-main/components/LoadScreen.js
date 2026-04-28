function LoadScreen({ status, onFetch, error, t, styles, L }) {
  const isDark = t.page === DARK.page;

  React.useEffect(() => {
    if (document.getElementById("ls-anim")) return;
    const s = document.createElement("style");
    s.id = "ls-anim";
    s.textContent = [
      "@keyframes ls-spin{to{transform:rotate(360deg)}}",
      "@keyframes ls-fadein{from{opacity:0}to{opacity:1}}",
      "@keyframes ls-pulse{0%,100%{opacity:1}50%{opacity:0.5}}",
    ].join("");
    document.head.appendChild(s);
  }, []);

  const bg = isDark ? "#121212" : "#fafafa";

  return h("div", {
    style: {
      background: bg,
      minHeight: 580,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "40px 24px",
      fontFamily: FONT_FAMILY,
    }
  },
    // Logo & Title
    h("div", { style: { position: "relative", zIndex: 1, textAlign: "center", animation: "ls-fadein .4s ease both" } },
      // Icon
      h("div", { 
        style: { 
          width: 80, 
          height: 80, 
          margin: "0 auto 40px",
          background: C.primary,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          boxShadow: isDark ? "0 8px 24px rgba(0, 0, 0, 0.3)" : "0 8px 24px rgba(0, 0, 0, 0.08)",
        } 
      }, "📊"),
      
      // Title
      h("div", { 
        style: { 
          fontSize: 32, 
          fontWeight: 700, 
          letterSpacing: 1, 
          marginBottom: 12, 
          color: isDark ? "#ffffff" : "#1a1a1a",
        } 
      }, APP_TITLE),
      
      // Subtitle
      h("div", { 
        style: { 
          fontSize: 12, 
          letterSpacing: 1, 
          marginBottom: 16, 
          color: isDark ? "#666666" : "#888888", 
          textTransform: "uppercase",
          fontWeight: 600,
        } 
      }, L.appSub),
      
      // Version
      h("div", { 
        style: { 
          display: "inline-block", 
          marginBottom: 48, 
          background: isDark ? "#1a1a1a" : "#ffffff", 
          border: `1px solid ${isDark ? "#2a2a2a" : "#e8e8e8"}`, 
          borderRadius: 6, 
          padding: "8px 20px", 
          fontSize: 10, 
          letterSpacing: 1.5, 
          color: isDark ? "#666666" : "#888888",
          fontWeight: 700,
        } 
      }, APP_VERSION),
      
      // Idle State
      status === "idle" && h("div", { style: { animation: "ls-fadein .5s ease both .2s", opacity: 0, animationFillMode: "forwards" } },
        h("div", { 
          style: { 
            fontSize: 13, 
            color: isDark ? "#888888" : "#666666", 
            marginBottom: 32, 
            lineHeight: 1.8, 
            letterSpacing: 0.3,
            fontWeight: 500,
          } 
        }, L.loadInfo1, h("br"), L.loadInfo2),
        
        h("button", {
          onClick: onFetch,
          className: "btn",
          onMouseEnter: e => { 
            e.currentTarget.style.background = "#1d4ed8";
            e.currentTarget.style.transform = "translateY(-2px)"; 
            e.currentTarget.style.boxShadow = "0 8px 16px rgba(37, 99, 235, 0.3)";
          },
          onMouseLeave: e => { 
            e.currentTarget.style.background = C.primary;
            e.currentTarget.style.transform = "translateY(0)"; 
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.2)";
          },
          style: { 
            background: C.primary,
            border: "none",
            borderRadius: 8, 
            color: "#ffffff", 
            cursor: "pointer", 
            fontSize: 13, 
            fontWeight: 700, 
            padding: "16px 48px", 
            letterSpacing: 1, 
            fontFamily: FONT_FAMILY,
            transition: "all .2s ease",
            textTransform: "uppercase",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
          }
        }, L.loadTitle)
      ),
      
      // Loading State
      status === "loading" && h("div", { style: { animation: "ls-fadein .3s ease both" } },
        h("div", { 
          style: { 
            width: 48, 
            height: 48, 
            margin: "0 auto 24px", 
            border: `3px solid ${isDark ? "#2a2a2a" : "#e8e8e8"}`, 
            borderTop: `3px solid ${C.primary}`, 
            borderRadius: "50%", 
            animation: "ls-spin .8s linear infinite" 
          } 
        }),
        h("div", { 
          style: { 
            fontSize: 14, 
            color: isDark ? "#ffffff" : "#1a1a1a", 
            fontWeight: 700, 
            letterSpacing: 0.5, 
            marginBottom: 10 
          } 
        }, L.loading),
        h("div", { 
          style: { 
            fontSize: 11, 
            color: isDark ? "#666666" : "#888888", 
            letterSpacing: 0.3,
            fontWeight: 500,
          } 
        }, L.loadingSub)
      ),
      
      // Error State
      error && h("div", { 
        style: { 
          background: isDark ? "#1a1a1a" : "#ffffff", 
          border: `1px solid ${C.danger}`, 
          borderRadius: 12, 
          padding: "32px", 
          maxWidth: 420, 
          textAlign: "center", 
          marginTop: 24, 
          animation: "ls-fadein .3s ease both",
          boxShadow: isDark ? "0 8px 24px rgba(0, 0, 0, 0.3)" : "0 8px 24px rgba(0, 0, 0, 0.08)",
        } 
      },
        h("div", { 
          style: { 
            fontSize: 40, 
            marginBottom: 20,
            animation: "ls-pulse 2s ease-in-out infinite",
          } 
        }, "⚠"),
        h("div", { 
          style: { 
            color: C.danger, 
            fontSize: 14, 
            marginBottom: 12, 
            fontWeight: 700, 
            letterSpacing: 0.5,
            textTransform: "uppercase",
          } 
        }, L.errTitle),
        h("div", { 
          style: { 
            color: isDark ? "#888888" : "#666666", 
            fontSize: 12, 
            lineHeight: 1.8, 
            marginBottom: 24, 
            whiteSpace: "pre-line",
            fontWeight: 500,
          } 
        }, error),
        h("button", { 
          onClick: onFetch,
          className: "btn",
          style: { 
            background: "transparent", 
            border: `2px solid ${C.danger}`, 
            borderRadius: 8, 
            color: C.danger, 
            cursor: "pointer", 
            fontSize: 12, 
            padding: "12px 32px", 
            fontFamily: FONT_FAMILY, 
            letterSpacing: 0.5,
            fontWeight: 700,
            transition: "all .2s ease",
          },
          onMouseEnter: e => {
            e.currentTarget.style.background = C.danger;
            e.currentTarget.style.color = "#fff";
          },
          onMouseLeave: e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = C.danger;
          },
        }, "↻ " + L.errRetry)
      )
    )
  );
}
