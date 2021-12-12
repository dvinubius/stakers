import React from "react";
import { Card, Progress } from "antd";
import { Balance } from "..";
import { softTextCol } from "../../styles";

const TotalStaker = ({ complete, totalStakedValue, price, isOver, threshold, belowThreshold, openForWithdraw }) => {
  const stakedTotalPercentBn = totalStakedValue && threshold && totalStakedValue.mul("100").div(threshold);
  const stakedTotalPercent = stakedTotalPercentBn && stakedTotalPercentBn.toNumber();

  return (
    <Card style={{ padding: 8, width: "15rem", opacity: complete ? 0.5 : 1 }}>
      {openForWithdraw && (
        <>
          <div style={{ fontSize: "1.25rem", color: softTextCol, marginBottom: "1rem" }}>Total to Withdraw</div>
          <Balance etherMode balance={totalStakedValue} fontSize={64} price={price} />
        </>
      )}
      {!openForWithdraw && (
        <>
          <div style={{ fontSize: "1.25rem", color: softTextCol }}>Target</div>

          <Balance etherMode balance={threshold} fontSize={64} price={price} />
          <Progress
            style={{ opacity: isOver && belowThreshold ? 0.5 : 1, margin: "1rem 0" }}
            percent={stakedTotalPercent}
            size="small"
          />
          <div style={{ fontSize: "1.25rem", color: softTextCol }}>Total Staked</div>

          <Balance etherMode balance={totalStakedValue} fontSize={64} price={price} />
        </>
      )}
    </Card>
  );
};

export default TotalStaker;
