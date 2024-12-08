import React from 'react';
import { Analytics } from "tenable-analytics";

const AnalyticsPage = () => (
  <div>
    <h1>Site Analytics</h1>
    <Analytics className="w-96 h-96 border-4 border-red-500 m-10" />
  </div>
);

export default AnalyticsPage;
