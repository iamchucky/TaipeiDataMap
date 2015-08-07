$(document).ready(function() {

var dataset = null;
var population = null;
var resolution = {
  district: [],
  village: []
};
var selectedDataset = '';
var selectedResolution = 'district';
var selectedMonth = 0;
var maxMonth = 7;
var clickedFeature = null;

function switchLocale(locale) {
  if (locale == 'en') {
    $.cookie('locale', locale);
  } else {
    $.cookie('locale', 'zh');
  }
  location.reload();
}

$('#localeToggle').click(function() {
  var loc = $(this).attr('loc');
  switchLocale(loc);
});

var loc = $.cookie('locale');
if (loc && loc == 'en') {
  $('#localeToggle').text('中文');
  $('#localeToggle').attr('loc', 'zh');
}

function populateProperLocale() {
  $('#useRatioFilterLabel')._t('比例');
  $('#selectedMonthText')._t('總');
}

populateProperLocale();
$('#monthRange').on('input', function(e) {
  var val = $(this).val();
  if (val == 0) {
    val = $.i18n._('總');
  } else {
    val = $.i18n._(val+'月');
  }
  $('#selectedMonthText').text(val);
});
$('#monthRange').change(function(e) {
  selectedMonth = $(this).val();
  if (filterProperty) {
    showDataWithOpacity(filterProperty.datasetName, filterProperty.title, filterProperty.prop);
  }
  if (infoPaneOpened) {
    var belong = clickedFeature.getProperty('belong');
    var district = clickedFeature.getProperty('name');
    if (belong) {
      district = belong + district;
    }
    populateInfo(district);
  }
});

function loadData() {
  ajax('GET', 'dataset.json', function(xmlhttp) {
    var data = JSON.parse(xmlhttp.responseText);
    if (data) {
      dataset = data;
      selectedDataset = '各區人口統計';
      populateMenu();
      populateFilterMenu();
    }
  });
  ajax('GET', 'population.json', function(xmlhttp) {
    var data = JSON.parse(xmlhttp.responseText);
    if (data) {
      population = data;
    }
  });
}

var filterProperty = null;
var ratioFilter = true;
function populateFilterMenu() {
  var htmlStr = '';
  for (var datasetName in dataset) {
    var data = dataset[datasetName].data;
    htmlStr += '<div dataset="'+datasetName+'" style="display:'+((selectedDataset == datasetName)?'block':'none')+'">';
    for (var s in data.body.properties) {
      htmlStr += '<li class="divider"></li>';
      htmlStr += '<div class="title">'+$.i18n._(s)+'</div>';
      var props = data.body.properties[s];
      for (var i = 0; i < props.length; ++i) {
        var p = props[i];
        htmlStr += '<li dataset="'+datasetName+'" title="'+s+'" prop="'+p+'">'+$.i18n._(p)+'</li>';
      }
    }
    htmlStr += '</div>';
  }
  $('#filterDropList').html(htmlStr);
  $('#filterDropList li').click(function() {
    var datasetName = $(this).attr('dataset');
    var title = $(this).attr('title');
    var prop = $(this).attr('prop');
    filterProperty = {
      datasetName: datasetName,
      title: title,
      prop: prop
    };
    $('#filterDropList li').removeClass('active');
    $(this).addClass('active');

    showDataWithOpacity(datasetName, title, prop);
  });
  $('#useRatioFilter').click(function() {
    ratioFilter = !ratioFilter;
    if (filterProperty) {
      showDataWithOpacity(filterProperty.datasetName, filterProperty.title, filterProperty.prop);
    }
  });
}

function getNormalizeValue(datasetName, title, prop) {
  // find max and min of the values
  var datas = dataset[datasetName].data.body.stats[title];
  var propInd = dataset[datasetName].data.body.properties[title].indexOf(prop);
  var min = Number.MAX_VALUE;
  var max = 0;
  var res = resolution[selectedResolution];
  var hasTime = dataset[datasetName].data.metadata.hasTime;
  for (var i = 0; i < res.length; ++i) {
    if (!datas[res[i]]) {
      console.log(res[i]);
    }
    var val = datas[res[i]][propInd];
    if (hasTime) {
      val = val[selectedMonth];
    }

    if (ratioFilter) {
      val /= population[res[i]];
    }
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
  var norm = getNormalizeValue(datasetName, title, prop);
  map.data.setStyle(function(feature) {
    var color = 'red';
    var resolution = feature.getProperty('resolution');
    var name = feature.getProperty('name');
    var belong = feature.getProperty('belong');
    if (resolution == 'village') {
      name = belong+name;
    }
    var visible = (resolution === selectedResolution && (name in dataset[datasetName].data.body.stats[title]));
    var out = {
      fillColor: color,
      strokeColor: color,
      strokeWeight: 1,
      visible: visible
    }
    if (visible) {
      var propInd = dataset[datasetName].data.body.properties[title].indexOf(prop);
      var val = dataset[datasetName].data.body.stats[title][name][propInd];
      var hasTime = dataset[datasetName].data.metadata.hasTime;
      if (hasTime) {
        val = val[selectedMonth];
      }
      if (ratioFilter) {
        val /= population[name];
      }
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
    var rawDownload = '';
    if (r.data.metadata.raw) {
      rawDownload = '<a href="'+r.data.metadata.raw+'" target="_blank" class="rawDownload"><i class="material-icons">insert_chart</i></a>';
    }
    htmlStr += '<li class="datasetNames black-text '+isActive+'" dataset="'+datasetName+'">'+$.i18n._(datasetName)+rawDownload+'</li>';
  }
  $('#slide-out > div').append($(htmlStr));
  $('.rawDownload').click(function(e) {
    e.stopPropagation();
  });

  $('.datasetNames').click(function() {
    selectedDataset = $(this).attr('dataset');
    $('.datasetNames').removeClass('active');
    $(this).addClass('active');

    setVisibleData('district');
    $('#resolutionToggle')._t('區');
    if (dataset[selectedDataset].data.metadata.hasVillage) {
      $('#resolutionToggle').show();
    } else {
      $('#resolutionToggle').hide();
    }
    selectedResolution = 'district';

    closeInfoPane();

    // display proper menu for the dataset
    $('#filterDropList > div').hide();
    $('#filterDropList > div[dataset="'+selectedDataset+'"]').show();
    $('#filterDropList li').removeClass('active');

    if (dataset[selectedDataset].data.metadata.hasTime) {
      $('#monthRangeContainer').show();
    } else {
      $('#monthRangeContainer').hide();
    }
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
    var props = selectedData.body.properties[e.category];
    for (var j = 0; j < props.length; ++j) {
      var prop = props[j];
      var v = r[district][j];
      var hasTime = selectedData.metadata.hasTime;
      if (hasTime) {
        v = v[selectedMonth];
        //v = v[0];
      }
      chartData.push([$.i18n._(prop), v]);
    }
    var data = google.visualization.arrayToDataTable(chartData);
    var chart = new google.visualization.PieChart(document.getElementById(e.pie));
    chart.draw(data, chartOptions);
  }
}

function drawAreaChart(district, elemIds) {
  if (!dataset) return;

  var selectedData = dataset[selectedDataset].data;
  if (!selectedData.metadata.hasTime) return;

  var chartOptions = {
    legend: 'none',
    isStacked: true,
    crosshair: {
      trigger: 'both',
      orientation: 'vertical'
    }
  };
  for (var i = 0; i < elemIds.length; ++i) {
    var e = elemIds[i];
    var r = selectedData.body.stats[e.category];
    var chartData = [['Month']];
    var props = selectedData.body.properties[e.category];
    for (var j = 0; j < props.length; ++j) {
      chartData[0].push($.i18n._(props[j]));
      for (var k = 1; k <= maxMonth; ++k) {
        var v = r[district][j][k];
        if (j == 0) {
          chartData.push([$.i18n._(k+'月'), v]);
        } else {
          chartData[k].push(v);
        }
      }
    }
    var data = google.visualization.arrayToDataTable(chartData);
    var chart = new google.visualization.AreaChart(document.getElementById(e.area));
    chart.draw(data, chartOptions);

    var cli = chart.getChartLayoutInterface();
    /*
    var bb = cli.getChartAreaBoundingBox();
    bb.width = 1;
    $('.areaChartLineOverlay').css(bb);
    */
    if (selectedMonth > 0) {
      $('.areaChartLineOverlay').css('left', cli.getXLocation(selectedMonth-1));
    }
  }
}

function populateInfo(district) {
  if (!dataset) return;

  var selectedData = dataset[selectedDataset].data;
  var htmlStr = '<h3 style="color:#727272">' + $.i18n._(district) + '</h3>';
  //htmlStr += '<p id="infoNotes">' + selectedData.metadata.notes+ '</p>';
  var stats = selectedData.body.stats;
  var elemIdsToDraw = [];
  for (var cat in stats) {
    var r = stats[cat];
    var catText = $.i18n._(cat);
    if (catText == $.i18n._('總') && selectedData.metadata.hasTime && selectedMonth != 0) {
      catText = $.i18n._(selectedMonth + '月');
    }
    htmlStr += '<div class="card"><div class="card-content"><span class="card-title black-text">'+catText+'</span>';

    if (selectedData.body.categoriesWithChart.indexOf(cat) >= 0) {
      var pieElemId = 'piechart'+elemIdsToDraw.length;
      var areaElemId = 'areachart'+elemIdsToDraw.length;
      elemIdsToDraw.push({
        category: cat,
        pie: pieElemId,
        area: areaElemId
      });
      htmlStr += '<div id="'+pieElemId+'" style="width: 100%; height: 250px;"></div>';
      if (selectedData.metadata.hasTime) {
        htmlStr += '<div style="position: relative">';
        htmlStr += '<div id="'+areaElemId+'" style="width: 100%; height: 250px;"></div>';
        htmlStr += '<div class="areaChartLineOverlay"></div>';
        htmlStr += '</div>';
      }
    }
    var props = selectedData.body.properties[cat];
    for (var j = 0; j < props.length; ++j) {
      var prop = props[j];
      var v = r[district][j];
      var hasTime = selectedData.metadata.hasTime;
      if (hasTime) {
        v = v[selectedMonth];
        //v = v[0];
      }
      htmlStr += '<div style="margin:5px 0">' + $.i18n._(prop) + ': ' + v + '</div>';
    }

    htmlStr += '</div></div></div>';
  }

  $('#infoBody').html(htmlStr);
  drawPieChart(district, elemIdsToDraw);
  if (selectedData.metadata.hasTime) {
    drawAreaChart(district, elemIdsToDraw);
  }
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
    zoomControl: true,
    disableDefaultUI: true
  });
  
  ajax('GET', 'districts.kml', function(xmlhttp) {
	  map.data.addGeoJson(toGeoJSON.kml(xmlhttp.responseXML));
	  map.data.forEach(function(feature) {
	    var name = feature.getProperty('name');
	    resolution.district.push(name);
    });

    ajax('GET', 'villages.kml', function(xmlhttp) {
      map.data.addGeoJson(toGeoJSON.kml(xmlhttp.responseXML));
      map.data.forEach(function(feature) {
        var name = feature.getProperty('name');
        var belong = feature.getProperty('belong');
        if (!belong) return;

        resolution.village.push(belong+name);
      });

      setVisibleData('district');
      registerListeners();

      $('#preloader').hide();
    });
  });

  $('#resetState').click(function() {
    setVisibleData('district');
  });

  function registerListeners() {
    $(document).keyup(function(e) {
      if (e.which == 27) { // ESC
        closeInfoPane();
      }
    });

	  map.data.addListener('click', function(event) {
	    var district = event.feature.getProperty('name');
      var belong = event.feature.getProperty('belong');
      if (belong) {
        district = belong + district;
      }
      map.data.revertStyle();
      clickedFeature = event.feature;
      map.data.overrideStyle(clickedFeature, { fillColor: 'red', strokeColor: 'red', strokeWeight: 3});

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
      var belong = event.feature.getProperty('belong');
      if (belong) {
        district = belong + district;
      }

      var i18nDistrict = $.i18n._(district);

      if (filterProperty) {
        var propInd = dataset[filterProperty.datasetName].data.body.properties[filterProperty.title].indexOf(filterProperty.prop);
        var val = dataset[filterProperty.datasetName].data.body.stats[filterProperty.title][district][propInd];
        var hasTime = dataset[filterProperty.datasetName].data.metadata.hasTime;
        if (hasTime) {
          val = val[selectedMonth];
        }
        if (ratioFilter) {
          i18nDistrict += ': '+(100*val/population[district]).toFixed(2)+'%';
        } else {
          i18nDistrict += ': '+val;
        }
      }
      $('.pageTitle').text(i18nDistrict);
	  });

	  map.data.addListener('mouseout', function(event) {
      map.data.revertStyle();
      map.data.overrideStyle(clickedFeature, { fillColor: 'red', strokeColor: 'red', strokeWeight: 3});
      $('.pageTitle').text('');
	  });

	  $('#resolutionToggle').click(function() {
	    if (selectedResolution == 'district') {
        var hasVillage = dataset[selectedDataset].data.metadata.hasVillage;
        if (!hasVillage) return;

	      selectedResolution = 'village';
	      $(this)._t('里');
      } else {
	      selectedResolution = 'district';
	      $(this)._t('區');
      }
	    setVisibleData(selectedResolution);
      $('#filterDropList li').removeClass('active');
      closeInfoPane();
    });
  }

}

google.maps.event.addDomListener(window, 'load', initialize);

$(".button-collapse").sideNav();
});
