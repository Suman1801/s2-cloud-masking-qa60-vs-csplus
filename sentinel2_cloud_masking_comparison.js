// ----------------------------------------
// Load Sentinel-2 Harmonized
// ----------------------------------------
var s2 = ee.ImageCollection('COPERNICUS/S2_HARMONIZED');

// Define Barasat point
var geometry = ee.Geometry.Point([88.518, 22.719]);

// Filter images
var filteredS2 = s2
  .filterBounds(geometry)
  .filterDate('2025-01-01', '2025-07-01')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 35));

// Sort by cloudiness and get most cloudy image
var image = ee.Image(filteredS2.sort('CLOUDY_PIXEL_PERCENTAGE', false).first());

// Visualize RGB
var rgbVis = {
  min: 0.0,
  max: 3000,
  bands: ['B4', 'B3', 'B2'],
};

Map.centerObject(image, 10);
Map.addLayer(image, rgbVis, 'Original Image');

// ----- QA60 MASK -----
function maskS2_QA60(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
              .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask)
              .copyProperties(image, image.propertyNames());
}

// Apply QA60 masking
var imageMaskedQA60 = ee.Image(maskS2_QA60(image));
Map.addLayer(imageMaskedQA60, rgbVis, 'QA60 Masked Image');

// Create binary QA60 cloud mask: 1 = clear, 0 = cloud
var qa = image.select('QA60');
var cloudBitMask = 1 << 10;
var cirrusBitMask = 1 << 11;
var qa60_mask = qa.bitwiseAnd(cloudBitMask).eq(0)
                 .and(qa.bitwiseAnd(cirrusBitMask).eq(0))
                 .rename('QA60_Clear');
Map.addLayer(qa60_mask, {min: 0, max: 1, palette: ['red', 'green']}, 'QA60 Binary Mask');

// ----- CLOUD SCORE+ MASK -----
var csPlus = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED');
var imageWithCS = ee.Image(image.linkCollection(csPlus, csPlus.first().bandNames()));
var clearThresh = 0.2;
function maskCSplus(image) {
  var csMask = image.select('cs').gte(clearThresh);
  return image.updateMask(csMask)
              .copyProperties(image, image.propertyNames());
}
var imageMaskedCS = ee.Image(maskCSplus(imageWithCS));
Map.addLayer(imageMaskedCS, rgbVis, 'Cloud Score+ Masked Image');

// Create binary CS+ cloud mask: 1 = clear, 0 = cloudy
var csBinaryMask = imageWithCS.select('cs').gte(clearThresh).rename('CSPlus_Clear');
Map.addLayer(csBinaryMask, {min: 0, max: 1, palette: ['red', 'green']}, 'CloudScore+ Binary Mask');

// ----------------------------------------
// Export Region and Pixel Area
// ----------------------------------------
var exportRegion = image.geometry().bounds();
var pixelArea = ee.Image.pixelArea();

// ----------------------------------------
// Function to Compute % Clear Area
// ----------------------------------------
function computeStats(mask, label) {
  var cloudFreePixels = mask.eq(1);
  var totalPixels = mask.mask();

  var stats = pixelArea.updateMask(cloudFreePixels).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: image.geometry(),
    scale: 10,
    maxPixels: 1e13
  });

  var totalStats = pixelArea.updateMask(totalPixels).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: image.geometry(),
    scale: 10,
    maxPixels: 1e13
  });

  var clearArea = ee.Number(stats.get('area'));
  var totalArea = ee.Number(totalStats.get('area'));
  var percentClear = clearArea.divide(totalArea).multiply(100);

  print(label + ' Clear Area (m²):', clearArea);
  print(label + ' Total Area (m²):', totalArea);
  print(label + ' % Clear:', percentClear);

  return percentClear;
}

// Compute % Clear Values
var qa60_percent = computeStats(qa60_mask, 'QA60');
var csplus_percent = computeStats(csBinaryMask, 'CloudScore+');

// ----------------------------------------
// Chart for % Clear Area Comparison
// ----------------------------------------
var chart = ui.Chart.array.values(
  ee.Array([[qa60_percent], [csplus_percent]]),
  0,
  ['QA60', 'CloudScore+']
)
.setChartType('ColumnChart')
.setOptions({
  title: '% Clear-Sky Pixels Comparison',
  hAxis: { title: 'Masking Method' },
  vAxis: { title: '% Clear Area', minValue: 0, maxValue: 100 },
  legend: { position: 'none' },
  colors: ['#66c2a5']
});
print(chart);

// ----------------------------------------
// Export Images
// ----------------------------------------
// 1. Export Original Image
Export.image.toDrive({
  image: image.visualize(rgbVis),
  description: 'S2_Original_Barasat',
  folder: 'GEE_Exports',
  fileNamePrefix: 'S2_Original_Barasat_2025',
  region: exportRegion,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

// 2. Export QA60 Masked Image
Export.image.toDrive({
  image: imageMaskedQA60.visualize(rgbVis),
  description: 'S2_QA60_Masked_Barasat',
  folder: 'GEE_Exports',
  fileNamePrefix: 'S2_QA60_Masked_Barasat_2025',
  region: exportRegion,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

// 3. Export CloudScore+ Masked Image
Export.image.toDrive({
  image: imageMaskedCS.visualize(rgbVis),
  description: 'S2_CSPlus_Masked_Barasat',
  folder: 'GEE_Exports',
  fileNamePrefix: 'S2_CSPlus_Masked_Barasat_2025',
  region: exportRegion,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

// 4. Export QA60 Binary Cloud Mask
Export.image.toDrive({
  image: qa60_mask,
  description: 'QA60_Binary_Mask_Barasat',
  folder: 'GEE_Exports',
  fileNamePrefix: 'QA60_Binary_Mask_Barasat_2025',
  region: exportRegion,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

// 5. Export CloudScore+ Binary Cloud Mask
Export.image.toDrive({
  image: csBinaryMask,
  description: 'CSPlus_Binary_Mask_Barasat',
  folder: 'GEE_Exports',
  fileNamePrefix: 'CSPlus_Binary_Mask_Barasat_2025',
  region: exportRegion,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});
