import { ClockCircleOutlined } from "@ant-design/icons";
import humanizeDuration from "humanize-duration";
import React from "react";
import { primaryCol, softTextCol } from "../../styles";

const StakerTimer = ({ timeLeft }) => {
  let timeLeftNum = timeLeft && timeLeft.toNumber();

  const isOver = timeLeftNum === 0;
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        height: "8rem",
      }}
    >
      <div style={{ padding: 8 }}>
        {!isOver && (
          <div
            style={{
              animation: "tick 1s cubic-bezier(0, 0.99, 0, 0.99) infinite",
              display: "block",
              color: isOver ? "#cdcdcd" : primaryCol,
              // border: "4px solid currentColor",
              boxShadow: "0 0 28px 2px currentColor inset",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "8rem",
              height: "8rem",
              borderRadius: "50%",
            }}
          ></div>
        )}
        <ClockCircleOutlined
          style={{
            display: "block",
            zIndex: 10,
            opacity: 0.2,
            fontSize: "8rem",
            color: isOver ? "#cdcdcd" : primaryCol,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        {isOver && <span style={{ fontSize: "1.5rem", color: softTextCol }}>Time is up! </span>}
        {!isOver && timeLeftNum !== 0 && (
          <span
            style={{
              fontSize: "1.5rem",
              color: softTextCol,
            }}
          >
            {timeLeftNum && humanizeDuration(timeLeftNum * 1000, { units: ["d", "h", "m", "s"] })}
          </span>
        )}
        <br />
      </div>
    </div>
  );
};

export default StakerTimer;
