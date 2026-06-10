// SPDX-License-Identifier: MIT
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Form } from "./components";
import { createState } from "./lib/state";
import { compile, getData } from './swr/fetchers';
import './index.css';

// The compiled data field can be a record, a non-empty array, or a bare value
// (number, string). Render whenever there is something to show.
function hasRenderableData(data) {
  if (data === null || data === undefined) {
    return false;
  }
  if (typeof data === "object") {
    return Object.keys(data).length > 0;
  }
  return true;
}

// Compile/stored responses use the standard { data, errors } envelope. A
// response carrying a `data` and/or `errors` field is read as an envelope; a
// payload with neither (legacy/raw value or host-provided init data) is used
// as the data model itself.
function unwrapEnvelope(resp) {
  if (
    resp && typeof resp === "object" && !Array.isArray(resp) &&
    ("data" in resp || "errors" in resp)
  ) {
    return {
      data: resp.data,
      errors: Array.isArray(resp.errors) ? resp.errors : [],
    };
  }
  return { data: resp, errors: [] };
}

/*
  View manages the state of the form. It may or may not use the server compiler
  to handle state transitions. Its interface with the host is through the url
  search parameters and message passing. This is to ensure that it can be
  embedded in an iframe or rendered in a blank browser window without losing any
  functionality.

  There are two basic actions that need to be reduced by state: `update` and
  `compile`. 'update' triggers a recompile, and 'compile' registers the result
  of the compile.

  'state' can handle other, more specific, actions but they should follow the
  basic pattern of triggering a compile on update.

  If either 'accessToken' or 'id' is undefined, then recompiles are skipped. In
  that case any state transitions that need to occur must be handled by other
  methods.

  If the parent origin is provided, the view will post the state data to it when
  it chanages.
*/

export const View = () => {
  const params = new URLSearchParams(window.location.search);
  const [ id, setId ] = useState(params.get("id"));
  const [ accessToken, setAccessToken ] = useState(params.get("access_token"));
  const [ targetOrigin, setTargetOrigin ] = useState(params.get("origin"));
  const [ doGetData, setDoGetData ] = useState(false);
  const [ doCompile, setDoCompile ] = useState(false);
  const [ state ] = useState(createState({}, (data, { type, args }) => {
    // console.log(
    //   "L0173/state.apply()",
    //   "type=" + type,
    //   "args=" + JSON.stringify(args, null, 2)
    // );
    switch (type) {
    case "init":
      // Init data on first load.
      return {
        ...args,
      };
    case "compiled":
      // A record merges into existing state; a non-record result (number,
      // string, list) replaces it.
      if (typeof args === "object" && args !== null && !Array.isArray(args)) {
        return {
          ...data,
          ...args,
        };
      }
      return args;
    case "update":
      const merged = {
        ...data,
        ...args,
      };
      // Only trigger compile if the merged state is different from current state
      if (JSON.stringify(merged) !== JSON.stringify(data)) {
        setDoCompile(true);
        if (targetOrigin) {
          window.parent.postMessage({focus: {type: "theme", value: merged}}, targetOrigin);
        }
      }
      return merged;
    default:
      console.error(false, `Unimplemented action type: ${type}`);
      return data;
    }
  }));

  useEffect(() => {
    if (window.location.search) {
      const data = params.get("data");
      if (data) {
        state.apply({
          type: "init",
          args: JSON.parse(data),
        });
      }
    }
  }, [window.location.search]);

  // Post onload message when view first renders
  useEffect(() => {
    if (targetOrigin) {
      window.parent.postMessage({ type: "onload", version: state.version, data: state.data }, targetOrigin);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    // If `id` changes, then getData.
    if (id) {
      setDoGetData(true);
    }
  }, [id]);

  // Post state data to parent whenever it changes
  useEffect(() => {
    if (targetOrigin) {
      window.parent.postMessage({ type: "data-updated", data: state.data }, targetOrigin);
    }
  }, [JSON.stringify(state.data)]);

  const getDataResp = useSWR(
    doGetData && id && {
      accessToken,
      id,
    },
    getData
  );

  if (getDataResp.data) {
    // Stored data uses the same { data, errors } envelope as /compile.
    const { data, errors } = unwrapEnvelope(getDataResp.data);
    state.setErrors(errors);
    if (errors.length === 0 && data !== null && data !== undefined) {
      state.apply({
        type: "compiled",
        args: data,
      });
    }
    setDoGetData(false);
  }

  const compileResp = useSWR(
    doCompile && id && {
      accessToken,
      id,
      data: state.data,
    },
    compile
  );

  if (compileResp.data) {
    // Unwrap the { data, errors } envelope.
    const { data, errors } = unwrapEnvelope(compileResp.data);
    state.setErrors(errors);
    if (errors.length === 0 && data !== null && data !== undefined) {
      state.apply({
        type: "compiled",
        args: data,
      });
    }
    setDoCompile(false);
  }

  return (
    (hasRenderableData(state.data) || state.errors.length > 0) &&
      <Form state={state} /> ||
      <div />
  );
}
