import axios from "axios";
import React, { useEffect, useState } from "react";
import "./App.css";

const App = () => {
  const [apiData, setApiData] = useState([]);
  const [traceMap, setTraceMap] = useState({});
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseData = await axios.get(
          "https://mocki.io/v1/40059489-6a19-4ca7-a41c-1c5c920e312c"
        );
        setApiData(responseData.data.spans);
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const createTree = () => {
      const traceMap = {};
      apiData.forEach((span) => {
        const { trace_id, span_id, parent_span_id } = span;
        if (!traceMap[trace_id]) {
          traceMap[trace_id] = {};
        }
        if (!traceMap[trace_id][span_id]) {
          traceMap[trace_id][span_id] = { ...span, children: [] };
        } else {
          traceMap[trace_id][span_id] = {
            ...traceMap[trace_id][span_id],
            ...span,
          };
        }
        if (parent_span_id && !traceMap[trace_id][parent_span_id]) {
          traceMap[trace_id][parent_span_id] = { children: [] };
        }
      });

      Object.keys(traceMap).forEach((traceId) => {
        Object.values(traceMap[traceId]).forEach((span) => {
          const { parent_span_id } = span;
          if (parent_span_id && traceMap[traceId][parent_span_id]) {
            traceMap[traceId][parent_span_id].children.push(span);
          }
        });
      });

      setTraceMap(traceMap);
    };

    if (apiData.length > 0) {
      createTree();
    }
  }, [apiData]);

  const renderSpan = (span) => {
    const { span_id, req_info, source, destination, children } = span;
    return (
      <li key={span_id}>
        <details>
          <summary>
            <div className="pathLatencyContainer">
              <div className="pathContainer">
                <p>
                  {req_info.req_method} {"  "} {req_info.req_path}
                </p>
                <p>
                  {source} → {destination}
                </p>
              </div>
              <div className="latencyContainer">
                <p
                  className={
                    showError && req_info.error ? "latancyError" : "latancy"
                  }
                >
                  {req_info.latency}
                </p>
              </div>
            </div>
          </summary>
          {children && children.length > 0 && (
            <ul>{children.map(renderSpan)}</ul>
          )}
        </details>
      </li>
    );
  };

  const renderTrace = (traceId) => {
    const rootSpans = Object.values(traceMap[traceId]).filter(
      (span) => !span.parent_span_id
    );

    return (
      <div key={traceId} className="traceId-card">
        <h2>{traceId}</h2>
        <button onClick={() => setShowError(!showError)}>Error</button>
        <button> Spans</button>
        <ul>{rootSpans.map((span) => renderSpan(span, showError))}</ul>
      </div>
    );
  };

  return (
    <div className="container">{Object.keys(traceMap).map(renderTrace)}</div>
  );
};

export default App;
