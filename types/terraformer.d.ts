declare module '@terraformer/arcgis' {
  // Converts an Esri JSON geometry or feature to GeoJSON.
  export function arcgisToGeoJSON(arcgis: unknown, idAttribute?: string): unknown;
  export function geojsonToArcGIS(geojson: unknown, idAttribute?: string): unknown;
}
