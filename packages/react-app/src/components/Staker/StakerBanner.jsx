import React from "react";
import { Balance } from "..";

const StakerBanner = ({ complete, balance, failed, externalContractBalance }) => {
  if (!complete && !failed) return "";
  const bg = complete ? "rgb(24 144 255 / 100%)" : "rgb(24 144 255 / 20%)";
  const border = complete ? "1px solid #aeaeae" : "1px solid #dedede";
  const col = complete ? "#fefefe" : "4a4a4a";
  const contentFontSize = "1rem";
  const balanceZero = balance && balance.toNumber && balance.eq("0");
  return (
    <div
      style={{
        padding: "1rem",
        background: bg,
        border: border,
        color: col,
        fontSize: contentFontSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {complete && (
        <>
          <span style={{ marginRight: "1rem", fontSize: "1.5rem" }}>
            🚀 🎖 👩‍🚀 -- <Balance etherMode balance={externalContractBalance} fontSize={"4rem"} /> FTW -- 🎉 🍾 🎊
          </span>
        </>
      )}
      {failed && (
        <>
          <span style={{ fontSize: "1.5rem" }}>-- Threshold not reached --</span>
          <span style={{ fontSize: "1.15em", margin: "0 0.5rem" }}>😟</span>
          {!balanceZero && <span style={{ fontSize: contentFontSize }}>You can withdraw</span>}
        </>
      )}
    </div>
  );
};

export default StakerBanner;
