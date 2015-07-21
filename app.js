$(document).ready(function() {

var dataset = null;
var districts = [];
var selectedDataset = '';
function loadData() {
  ajax('GET', 'datasets.json', function(xmlhttp) {
    var data = JSON.parse(xmlhttp.responseText);
    if (data) {
      dataset = data;
      selectedDataset = '各區人口統計';
      populateMenu();
      populateFilterMenu();
    }
  });
}

var filterProperty = null;
function populateFilterMenu() {
  var htmlStr = '';
  for (var datasetName in dataset) {
    var data = dataset[datasetName].data;
    htmlStr += '<div>';
    for (var s in data.body.properties) {
      htmlStr += '<div class="title">'+s+'</div>';
      var props = data.body.properties[s];
      for (var i = 0; i < props.length; ++i) {
        var p = props[i];
        htmlStr += '<li dataset="'+datasetName+'" title="'+s+'">'+p+'</li>';
      }
      htmlStr += '<li class="divider"></li>';
    }
    htmlStr += '</div>';
  }
  $('#settingsDrop').html(htmlStr);
  $('#settingsDrop li').click(function() {
    var datasetName = $(this).attr('dataset');
    var title = $(this).attr('title');
    var prop = $(this).text();
    filterProperty = {
      datasetName: datasetName,
      title: title,
      prop: prop
    };

    showDataWithOpacity(datasetName, title, prop);
  });
}

function getNormalizeValue(datasetName, title, prop) {
  // find max and min of the values
  var datas = dataset[datasetName].data.body.stats[title];
  var min = Number.MAX_VALUE;
  var max = 0;
  for (var i = 0; i < districts.length; ++i) {
    var val = datas[districts[i]][prop];
    if (val < min) {
      min = val;
    }
    if (val > max) {
      max = val;
    }
  }
  var scale = 0.8 / (max - min);
  return { scale: scale, min: min };
}

function showDataWithOpacity(datasetName, title, prop) {
  map.data.setStyle(function(feature) {
    var color = 'blue';
    var resolution = feature.getProperty('resolution');
    var name = feature.getProperty('name');
    var belong = feature.getProperty('belong');
    var visible = (resolution === 'district');
    var out = {
      fillColor: color,
      strokeColor: color,
      strokeWeight: 1,
      visible: visible
    }
    if (visible) {
      var val = dataset[datasetName].data.body.stats[title][name][prop];
      var norm = getNormalizeValue(datasetName, title, prop);
      out.fillOpacity = (val - norm.min) * norm.scale;
    }
    return out;
  })
}

function populateMenu() {
  var htmlStr = '';
  for (var datasetName in dataset) {
    var r = dataset[datasetName];
    var isActive = (datasetName == selectedDataset) ? 'active':'';
    htmlStr += '<li class="datasetNames black-text '+isActive+'">'+datasetName+'</li>';
  }
  $('#slide-out > div').append($(htmlStr));
  $('.datasetNames').click(function() {
    selectedDataset = $(this).text();
    $('.datasetNames').removeClass('active');
    $(this).addClass('active');
  });
}

var infoPaneOpened = false;
function openInfoPane() {
  if (!infoPaneOpened) {
    $('#infoBody').scrollTop(0);
    $('#info-right').css('right', 0);
  }
  infoPaneOpened = true;
}

function closeInfoPane() {
  $('#info-right').css('right', -510);
  infoPaneOpened = false;
}

$('#info-close').click(closeInfoPane);

function drawPieChart(district, elemIds) {
  if (!dataset) return;
  if (dataset[selectedDataset].data.body.districts.indexOf(district) < 0) return;

  var selectedData = dataset[selectedDataset].data;
  var chartOptions = {
    legend: {
      position: 'labeled'
    },
    chartArea: {
      width: '90%',
      height: '90%'
    }
  };
  for (var i = 0; i < elemIds.length; ++i) {
    var e = elemIds[i];
    var r = selectedData.body.stats[e.category];
    var chartData = [[e.category, 'value']];
    for (var prop in r[district]) {
      var v = r[district][prop];
      chartData.push([prop, v]);
    }
    var data = google.visualization.arrayToDataTable(chartData);
    var chart = new google.visualization.PieChart(document.getElementById(e.elemId));
    chart.draw(data, chartOptions);
  }
}

function populateInfo(district) {
  if (!dataset) return;
  if (dataset[selectedDataset].data.body.districts.indexOf(district) < 0) return;

  var selectedData = dataset[selectedDataset].data;
  var htmlStr = '<h3 style="color:#727272">' + district + '</h3>';
  htmlStr += '<p id="infoNotes">' + selectedData.metadata.notes+ '</p>';
  var stats = selectedData.body.stats;
  var elemIdsToDraw = [];
  for (var cat in stats) {
    var r = stats[cat];
    htmlStr += '<div class="card"><div class="card-content"><span class="card-title black-text">'+cat+'</span>';

    if (selectedData.body.categoriesWithChart.indexOf(cat) >= 0) {
      var elemId = 'piechart'+elemIdsToDraw.length;
      elemIdsToDraw.push({
        category: cat,
        elemId: elemId
      });
      htmlStr += '<div id="'+elemId+'" style="width: 100%; height: 250px;"></div>';
    }
    for (var prop in r[district]) {
      var v = r[district][prop];
      htmlStr += '<div>' + prop + ': ' + v + '</div>';
    }

    htmlStr += '</div></div></div>';
  }

  $('#infoBody').html(htmlStr);
  drawPieChart(district, elemIdsToDraw);
}

function ajax(method, url, callback, payload) {
  var xmlhttp;
  if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  } else {// code for IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState==4 && xmlhttp.status==200) {
      if (callback) {
        callback(xmlhttp);
      }
    }
  };
  xmlhttp.open(method, url, true);
  xmlhttp.send();
}

var map;

function setVisibleData(visibleResolution, districtName) {
  filterProperty = null;
  map.data.setStyle(function(feature) {
    var color = 'gray';
    var resolution = feature.getProperty('resolution');
    var name = feature.getProperty('name');
    var belong = feature.getProperty('belong');
    var visible = (resolution === visibleResolution);
    if (visible) {
      if (resolution == 'district' && name == districtName) {
        visible = false;
      }
    } else {
      if (visibleResolution == 'district' && belong == districtName) {
        visible = true;
        color = 'red';
      }
    }
    return /** @type {google.maps.Data.StyleOptions} */({
      fillColor: color,
      strokeColor: color,
      strokeWeight: 1,
      visible: visible
    });
  })
}
function initialize() {
  loadData();

  // Create a simple map.
  map = new google.maps.Map(document.getElementById('map-canvas'), {
    zoom: 12,
    center: { lat: 25.08, lng: 121.55 },
    disableDefaultUI: true
  });
  
  ajax('GET', 'districts.kml', function(xmlhttp) {
	  map.data.addGeoJson(toGeoJSON.kml(xmlhttp.responseXML));
	  map.data.forEach(function(feature) {
	    var name = feature.getProperty('name');
	    districts.push(name);
    });

    ajax('GET', 'villages.kml', function(xmlhttp) {
      map.data.addGeoJson(toGeoJSON.kml(xmlhttp.responseXML));

      setVisibleData('district');
      registerListeners();
    });
  });

  $('#resetState').click(function() {
    setVisibleData('district');
  });

  function registerListeners() {
	  var clickedFeature = null;
	  map.data.addListener('click', function(event) {
	    var district = event.feature.getProperty('name');
	    var resolution = event.feature.getProperty('resolution');
	    if (resolution == 'district') {
        setVisibleData(resolution, district);
      } else {
        map.data.revertStyle();
        clickedFeature = event.feature;
        map.data.overrideStyle(clickedFeature, { fillColor: 'red', strokeColor: 'red', strokeWeight: 3});
      }

	    populateInfo(district);
      openInfoPane();

      /*
      var center = event.feature.getProperty('center');
      if (center) {
        map.setCenter(new google.maps.LatLng(center.lat, center.lng));
      }
      */
    });

	  // When the user hovers, tempt them to click by outlining the letters.
	  // Call revertStyle() to remove all overrides. This will use the style rules
	  // defined in the function passed to setStyle()
	  map.data.addListener('mouseover', function(event) {
      map.data.revertStyle();
      map.data.overrideStyle(event.feature, { strokeWeight: 3});
      map.data.overrideStyle(clickedFeature, { fillColor: 'red', strokeColor: 'red', strokeWeight: 3});
      
      var district = event.feature.getProperty('name');

      if (filterProperty) {
        var val = dataset[filterProperty.datasetName].data.body.stats[filterProperty.title][district][filterProperty.prop];
        district += ': '+val;
      }
      $('.pageTitle').text(district);
	  });

	  map.data.addListener('mouseout', function(event) {
      map.data.revertStyle();
      map.data.overrideStyle(clickedFeature, { fillColor: 'red', strokeColor: 'red', strokeWeight: 3});
      $('.pageTitle').text('');
	  });

	  $('#navVillage').click(function() {
	    $(this).addClass('active');
	    $('#navDistrict').removeClass('active');
	    setVisibleData('village');
    });
	  $('#navDistrict').click(function() {
	    $(this).addClass('active');
	    $('#navVillage').removeClass('active');
	    setVisibleData('district');
    });
  }

}

google.maps.event.addDomListener(window, 'load', initialize);

$(".button-collapse").sideNav();
});
