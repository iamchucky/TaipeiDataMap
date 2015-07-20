$(document).ready(function() {

var dataset = null;
var selectedDataset = '';
function loadData() {
  ajax('GET', 'population_1040712.json', function(xmlhttp) {
    var data = JSON.parse(xmlhttp.responseText);
    if (data.data) {
      dataset = {};
      dataset[data.data.metadata.title] = data;
      selectedDataset = data.data.metadata.title;
      populateMenu();
    }
  });
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

    if (selectedData.body.categoriesWithChart.indexOf(cat) < 0) {
      for (var prop in r[district]) {
        var v = r[district][prop];
        htmlStr += '<div>' + prop + ': ' + v + '</div>';
      }
    } else {
      var elemId = 'piechart'+elemIdsToDraw.length;
      elemIdsToDraw.push({
        category: cat,
        elemId: elemId
      });
      htmlStr += '<div id="'+elemId+'" style="width: 100%; height: 250px;"></div>';
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

function setVisibleData(visibleResolution) {
  map.data.setStyle(function(feature) {
    var color = 'gray';
    var visible = (feature.getProperty('resolution') === visibleResolution);
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
	    feature.setProperty('resolution', 'district');
    });

    ajax('GET', 'villages.kml', function(xmlhttp) {
      map.data.addGeoJson(toGeoJSON.kml(xmlhttp.responseXML));
      map.data.forEach(function(feature) {
        if (feature.getProperty('resolution') !== 'district') {
          feature.setProperty('resolution', 'village');
        }
      });

      setVisibleData('district');
      registerListeners();
    });
  });

  function registerListeners() {
	  var clickedFeature = null;
	  map.data.addListener('click', function(event) {
      map.data.revertStyle();
	    clickedFeature = event.feature;
      map.data.overrideStyle(clickedFeature, { fillColor: 'red', strokeColor: 'red', strokeWeight: 3});
	    var district = event.feature.getProperty('name');
	    populateInfo(district);
      openInfoPane();
    });

	  // When the user hovers, tempt them to click by outlining the letters.
	  // Call revertStyle() to remove all overrides. This will use the style rules
	  // defined in the function passed to setStyle()
	  map.data.addListener('mouseover', function(event) {
      map.data.revertStyle();
      map.data.overrideStyle(event.feature, { strokeWeight: 3});
      map.data.overrideStyle(clickedFeature, { fillColor: 'red', strokeColor: 'red', strokeWeight: 3});
      
      var district = event.feature.getProperty('name');
      $('.pageTitle').text(district);
	  });

	  map.data.addListener('mouseout', function(event) {
      map.data.revertStyle();
      map.data.overrideStyle(clickedFeature, { fillColor: 'red', strokeColor: 'red', strokeWeight: 3});
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
