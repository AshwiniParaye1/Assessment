import axios from "axios";
import React, { useEffect, useState } from "react";
import "./App.css";

const App = () => {
  // Define state variables for API data, trace map, and error display
  const [apiData, setApiData] = useState([]);
  const [traceMap, setTraceMap] = useState({});
  const [showError, setShowError] = useState(false);

  // Fetch data from the API and store it in the apiData state
  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseData = await axios.get(
          "https://mocki.io/v1/40059489-6a19-4ca7-a41c-1c5c920e312c"
        );
        // Set the apiData state variable to the spans array in the response data
        setApiData(responseData.data.spans);
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    };

    // Call the fetchData function when the component mounts
    fetchData();
  }, []);

  // Create a trace map from the apiData state
  useEffect(() => {
    const createTree = () => {
      // Initialize an empty traceMap object
      const traceMap = {};
      // Loop through each span object in the apiData state
      apiData.forEach((span) => {
        const { trace_id, span_id, parent_span_id } = span;
        // If the trace ID doesn't exist in the traceMap, create it
        if (!traceMap[trace_id]) {
          traceMap[trace_id] = {};
        }
        // If the span ID doesn't exist in the traceMap, create it and add the span data
        if (!traceMap[trace_id][span_id]) {
          traceMap[trace_id][span_id] = { ...span, children: [] };
        } else {
          // If the span ID already exists in the traceMap, update the span data
          traceMap[trace_id][span_id] = {
            ...traceMap[trace_id][span_id],
            ...span,
          };
        }
        // If the span has a parent and the parent doesn't exist in the traceMap, create it
        if (parent_span_id && !traceMap[trace_id][parent_span_id]) {
          traceMap[trace_id][parent_span_id] = { children: [] };
        }
      });

      // Loop through each trace ID in the traceMap
      Object.keys(traceMap).forEach((traceId) => {
        // Loop through each span in the traceMap for the current trace ID
        Object.values(traceMap[traceId]).forEach((span) => {
          const { parent_span_id } = span;
          // If the span has a parent and the parent exists in the traceMap, add the span to its parent's children array
          if (parent_span_id && traceMap[traceId][parent_span_id]) {
            traceMap[traceId][parent_span_id].children.push(span);
          }
        });
      });

      // Set the traceMap state variable
      setTraceMap(traceMap);
    };

    // If the apiData state is not empty, create the trace map
    if (apiData.length > 0) {
      createTree();
    }
  }, [apiData]);

  // Render a span object as a list item
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
            // If the span has children, create a nested list
            <ul>{children.map(renderSpan)}</ul>
          )}
        </details>
      </li>
    );
  };

  // Render a card for a trace ID and display its root spans
  const renderTrace = (traceId) => {
    // Filter the spans in the traceMap for the current trace ID to find the root spans (spans with no parent)
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

  // Render a card for each trace ID in the traceMap
  return (
    <div className="container">{Object.keys(traceMap).map(renderTrace)}</div>
  );
};

export default App;
