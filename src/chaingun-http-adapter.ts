import {
  GunGetOpts,
  GunGraphAdapter,
  GunGraphData,
  GunNode
} from '@chaingun/types';
import 'isomorphic-fetch';

const BASE_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

export function createGraphAdapter(
  baseUrl: string,
  fetchOpts: any = {}
): GunGraphAdapter {
  return {
    get: (soul: string, opts?: GunGetOpts) =>
      get(fetchOpts, baseUrl, soul, opts),
    put: (graphData: GunGraphData) => put(fetchOpts, baseUrl, graphData)
  };
}

export async function get(
  fetchOpts: any,
  baseUrl: string,
  soul: string,
  opts?: GunGetOpts
): Promise<GunNode | null> {
  const singleKey = opts && opts['.'];

  const url = singleKey
    ? `${baseUrl}/key/${encodeURI(singleKey)}/${encodeURI(soul)}`
    : `${baseUrl}/nodes/${encodeURI(soul)}`;
  const response = await fetch(url, fetchOpts);

  if (response.status === 404) {
    return null;
  }

  if (response.status >= 400) {
    throw new Error('Bad response from server: ' + response.status);
  }

  const json = await response.json();

  if (!json) {
    return null;
  }

  return json;
}

export async function put(
  fetchOpts: any,
  baseUrl: string,
  data: GunGraphData
): Promise<GunGraphData | null> {
  const url = `${baseUrl}/nodes`;
  const response = await fetch(url, {
    headers: BASE_HEADERS,
    ...fetchOpts,
    body: JSON.stringify(data),
    method: 'PUT'
  });

  if (response.status >= 400) {
    throw new Error('Bad response from server: ' + response.status);
  }

  const json = await response.json();
  return json || null;
}
