import type { Language, TFunction } from "../../i18n";
import { DEMO_BRIEF, PRODUCT } from "../../marketingData";
import { RailIcon } from "./EditorialIcons";

type MockProps = { language: Language; t: TFunction };

const GREEN = "#116149";
const GREEN_SOFT = "#dceee2";
const GREEN_DEEP = "#0d523d";

export function EditorialBriefMock(_props: MockProps) {
  const b = DEMO_BRIEF;
  return (
    <div
      style={{
        background: "var(--ab-paper)",
        border: "1px solid var(--ab-rule)",
        boxShadow: "0 24px 60px -32px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--ab-rule)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--ab-paper-2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN }} />
          <span className="a-serif" style={{ fontWeight: 600, fontSize: 14 }}>
            Brief · {b.topic}
          </span>
        </div>
        <span
          className="a-mono"
          style={{ fontSize: 10, color: "var(--ab-ink-mute)", letterSpacing: "0.06em" }}
        >
          PERSONA · {b.persona_label.toUpperCase()}
        </span>
      </div>
      <div style={{ padding: 18 }}>
        <div className="a-smallcaps" style={{ marginBottom: 14 }}>
          Executive summary
        </div>
        <p className="a-serif" style={{ fontSize: 17, lineHeight: 1.5, margin: 0 }}>
          AI export-control measures aimed at China are gaining steam in the US House
          <span className="a-cite">Bloomberg · 1</span>, with Reuters reporting{" "}
          <span style={{ fontStyle: "italic" }} className="a-italic">
            new rules
          </span>{" "}
          may require US investments by foreign firms
          <span className="a-cite">Reuters · 2</span>, and Congress now advancing two bipartisan
          bills
          <span
            className="a-cite"
            style={{ background: "var(--ab-rule-soft)", color: "var(--ab-ink-soft)" }}
          >
            crypto.news · 3
          </span>
          .
        </p>
        <hr className="a-rule" style={{ margin: "20px 0 16px" }} />
        <div className="a-smallcaps" style={{ marginBottom: 12 }}>
          Sources · credibility × freshness × fit
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {b.source_evidence.map((r, i) => (
            <div
              key={r.n}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr 80px",
                gap: 14,
                alignItems: "center",
                fontSize: 13,
                paddingBottom: 8,
                borderBottom: i < 4 ? "1px solid var(--ab-rule-soft)" : "none",
              }}
            >
              <span
                className="a-mono"
                style={{ color: "var(--ab-ink-mute)", fontSize: 11 }}
              >
                {r.n}
              </span>
              <div>
                <div className="a-serif" style={{ fontWeight: 600, fontSize: 14 }}>
                  {r.src}
                  {i === 0 && (
                    <span className="a-cite" style={{ marginLeft: 6 }}>
                      cited 4×
                    </span>
                  )}
                </div>
                <div
                  className="a-mono"
                  style={{
                    color: "var(--ab-ink-mute)",
                    fontSize: 10.5,
                    letterSpacing: "0.04em",
                    marginTop: 2,
                    textTransform: "uppercase",
                  }}
                >
                  {r.cls}
                </div>
              </div>
              <div
                style={{
                  position: "relative",
                  height: 4,
                  background: "var(--ab-rule-soft)",
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: r.total * 100 + "%",
                    background: i === 0 ? GREEN : "var(--ab-ink)",
                    opacity: i === 0 ? 1 : 0.7,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EditorialAppMock({ language }: MockProps) {
  const zh = language === "zh";
  const b = DEMO_BRIEF;
  const STRIPE = `linear-gradient(${GREEN}, var(--ab-accent))`;
  const cols: Array<[string, string[], boolean]> = [
    [zh ? "要点" : "Takeaways", b.key_takeaways.slice(0, 3), false],
    [zh ? "关键事实" : "Key facts", b.key_facts.slice(0, 3), false],
    [zh ? "信号" : "Signals", b.insights.slice(0, 3), false],
    [zh ? "关注" : "Watch", b.uncertainties.slice(0, 3), true],
  ];
  return (
    <div className="a-screen">
      <div className="a-screen-bar">
        <div className="a-screen-dots">
          <i />
          <i />
          <i />
        </div>
        <span style={{ flex: 1, textAlign: "center" }}>
          {PRODUCT.endpoint} · /workspace
        </span>
        <span>{PRODUCT.edition}</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "64px 1fr",
          background: "var(--ab-paper)",
        }}
      >
        <aside
          style={{
            background: "var(--ab-ink)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "16px 0",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              background: "var(--ab-accent)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
              boxShadow:
                "0 8px 18px -6px color-mix(in oklab, var(--ab-accent) 70%, transparent)",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 1.5h5l3 3v8H3v-11z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path
                d="M8 1.5v3h3M5 7.5h4M5 9.5h3"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </span>
          {(
            [
              ["search", true],
              ["bookmark", false],
              ["radio", false],
            ] as Array<["search" | "bookmark" | "radio", boolean]>
          ).map(([k, on], i) => (
            <span
              key={i}
              style={{
                width: 40,
                height: 40,
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: on ? "#fff" : "color-mix(in oklab, var(--ab-paper) 52%, transparent)",
                background: on
                  ? `color-mix(in oklab, ${GREEN} 55%, transparent)`
                  : "transparent",
                border: on
                  ? `1px solid color-mix(in oklab, ${GREEN} 80%, transparent)`
                  : "1px solid transparent",
              }}
            >
              <RailIcon kind={k} />
            </span>
          ))}
        </aside>
        <main style={{ minWidth: 0 }}>
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 22px",
              borderBottom: "1px solid var(--ab-rule)",
              background:
                "color-mix(in oklab, var(--ab-paper) 70%, var(--ab-paper-2))",
            }}
          >
            <div>
              <div
                className="a-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ab-accent)",
                  fontWeight: 600,
                  marginBottom: 3,
                }}
              >
                {zh ? "分析师指挥中心" : "Analyst command center"}
              </div>
              <div
                className="a-serif"
                style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em" }}
              >
                {PRODUCT.name}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 11px",
                  borderRadius: 999,
                  background: GREEN_SOFT,
                  border: `1px solid color-mix(in oklab, ${GREEN} 30%, transparent)`,
                  fontFamily: "var(--ab-font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.04em",
                  color: GREEN_DEEP,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }}
                />{" "}
                {zh ? "本地数据已同步" : "Local data synced"}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "4px 5px 4px 11px",
                  borderRadius: 999,
                  border: "1px solid var(--ab-rule)",
                  fontSize: 12,
                }}
              >
                {zh ? "研究分析师" : "Research analyst"}
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--ab-ink)",
                    color: "var(--ab-paper)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--ab-font-display)",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  RA
                </span>
              </span>
            </div>
          </header>
          <div
            style={{
              padding: "18px 22px 26px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <section
              style={{
                position: "relative",
                overflow: "hidden",
                background: "color-mix(in oklab, var(--ab-paper) 94%, #fff)",
                border: "1px solid var(--ab-rule)",
                borderRadius: 10,
                padding: "18px 20px 18px 22px",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: STRIPE,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "var(--ab-font-display)",
                  fontSize: 14.5,
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                <RailIcon kind="search" /> {zh ? "研究指令" : "Research command"}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "12px 16px",
                    borderRadius: 9,
                    background: "var(--ab-paper)",
                    border: `1px solid ${GREEN}`,
                    boxShadow: `0 0 0 4px color-mix(in oklab, ${GREEN} 12%, transparent)`,
                  }}
                >
                  <span style={{ color: GREEN, display: "inline-flex" }}>
                    <RailIcon kind="search" />
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontFamily: "var(--ab-font-display)",
                      fontSize: 18,
                      fontWeight: 600,
                      letterSpacing: "-0.012em",
                    }}
                  >
                    {b.topic}
                  </span>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "0 22px",
                    borderRadius: 9,
                    minWidth: 132,
                    background: GREEN,
                    color: "#fff",
                    fontFamily: "var(--ab-font-display)",
                    fontSize: 14.5,
                    fontWeight: 600,
                    boxShadow: `0 12px 22px -10px color-mix(in oklab, ${GREEN} 75%, transparent)`,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 1.5l1.4 3.2 3.1 1.4-3.1 1.4L7 10.7l-1.4-3.2-3.1-1.4 3.1-1.4z"
                      fill="currentColor"
                    />
                  </svg>{" "}
                  {zh ? "生成" : "Generate"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: GREEN_SOFT,
                    color: GREEN_DEEP,
                    fontFamily: "var(--ab-font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.04em",
                    fontWeight: 600,
                  }}
                >
                  {zh ? "人设 · 研究分析师" : "PERSONA · RESEARCH ANALYST"}
                </span>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid var(--ab-rule)",
                    fontFamily: "var(--ab-font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.04em",
                    color: "var(--ab-ink-soft)",
                  }}
                >
                  {zh ? "模式 · 平衡" : "MODE · BALANCED"}
                </span>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid var(--ab-rule)",
                    fontFamily: "var(--ab-font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.04em",
                    color: "var(--ab-ink-soft)",
                  }}
                >
                  {zh ? "目标 · 投资敏感度" : "GOAL · INVESTOR EXPOSURE"}
                </span>
              </div>
            </section>
            <section
              style={{
                border: "1px solid var(--ab-rule)",
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--ab-paper)",
              }}
            >
              <div
                style={{ padding: "18px 22px", borderBottom: "1px solid var(--ab-rule)" }}
              >
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <span
                    style={{
                      padding: "2px 9px",
                      borderRadius: 999,
                      background: GREEN_SOFT,
                      color: GREEN_DEEP,
                      fontFamily: "var(--ab-font-mono)",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {zh ? "报告 · 就绪" : "REPORT · READY"}
                  </span>
                  <span
                    style={{
                      padding: "2px 9px",
                      borderRadius: 999,
                      border: "1px solid var(--ab-rule)",
                      fontFamily: "var(--ab-font-mono)",
                      fontSize: 10,
                      color: "var(--ab-ink-soft)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {zh ? "模式 · 实时" : "MODE · LIVE"}
                  </span>
                </div>
                <h3
                  className="a-serif"
                  style={{
                    fontSize: 26,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  {b.topic}
                </h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px" }}>
                <div style={{ padding: "18px 22px", borderRight: "1px solid var(--ab-rule)" }}>
                  <div
                    className="a-mono"
                    style={{
                      fontSize: 10,
                      color: "var(--ab-ink-mute)",
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    {zh ? "执行摘要" : "EXECUTIVE SUMMARY"}
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
                    {b.executive_summary}
                  </p>
                </div>
                <aside style={{ padding: "18px", background: "var(--ab-paper-2)" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      className="a-mono"
                      style={{
                        fontSize: 10,
                        color: "var(--ab-ink-mute)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {zh ? "置信度" : "CONFIDENCE"}
                    </span>
                    <span
                      className="a-serif"
                      style={{
                        fontSize: 34,
                        fontWeight: 600,
                        color: GREEN,
                        lineHeight: 1,
                      }}
                    >
                      {b.confidence.score}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 5,
                      background: "var(--ab-rule-soft)",
                      borderRadius: 3,
                      position: "relative",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: b.confidence.score + "%",
                        background: GREEN,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  {b.source_evidence.slice(0, 3).map((e, i) => (
                    <div
                      key={e.n}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 54px",
                        gap: 8,
                        alignItems: "center",
                        fontSize: 12,
                        marginBottom: 7,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{e.src}</span>
                      <div
                        style={{
                          height: 4,
                          background: "var(--ab-rule-soft)",
                          borderRadius: 2,
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: e.total * 100 + "%",
                            background: i === 0 ? GREEN : "var(--ab-ink)",
                            opacity: i === 0 ? 1 : 0.5,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </aside>
              </div>
              <div
                style={{
                  borderTop: "1px solid var(--ab-rule)",
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                }}
              >
                {cols.map(([title, items, muted], ci) => (
                  <div
                    key={title}
                    style={{
                      padding: "14px 16px",
                      borderLeft: ci ? "1px solid var(--ab-rule)" : 0,
                    }}
                  >
                    <div
                      className="a-mono"
                      style={{
                        fontSize: 9.5,
                        color: "var(--ab-ink-mute)",
                        letterSpacing: "0.08em",
                        marginBottom: 8,
                      }}
                    >
                      {title.toUpperCase()}
                    </div>
                    <ul
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {items.map((it, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 11.5,
                            lineHeight: 1.45,
                            color: muted ? "var(--ab-ink-soft)" : "var(--ab-ink)",
                            paddingLeft: 12,
                            position: "relative",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 6,
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              background: muted ? "var(--ab-ink-mute)" : GREEN,
                            }}
                          />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
