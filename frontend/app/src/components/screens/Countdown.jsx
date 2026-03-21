import React, { useEffect, useState } from 'react';
import './css/style.css';
import './css/count.css'

function Countdown({ value }) {
  return (
    <div className="countdown-circle">
      <span className="countdown-number">{value}</span>
    </div>
  );
}

export default Countdown;