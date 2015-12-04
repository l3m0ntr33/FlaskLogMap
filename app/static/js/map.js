var linksHistory = [];
var plotsHistory = [];
var pok = "";
var pdb = "";
var ptable = "";
var plat = "";
var plong = "";
var pgroupby = "";
var plgdfield1 = "col1";
var plgdfield2 = "col2";
var plgdfield3 = "col3";
var plgdfield4 = "col4";
var mapactive = "yes";
var groupby = "yes";
var groupbyfield = "ip_host";
var refreshinterval = 3;
var intertimer = 1;
var maxHistory = 10;

$(document).ready( function () {
	initmap();
	$.getJSON('/dblist',function(data){
		$.each(data,function(i,val){
			$('#selectdb').append('<option value='+i+'>'+i+'</option>');
		});
	});
	myLegend = $('#legend').DataTable(
	{"columns": [
            { "data": "lgdfld1", "name":plgdfield1,"title":plgdfield1 },
            { "data": "lgdfld2", "name":plgdfield2,"title":plgdfield2 },
            { "data": "lgdfld3", "name":plgdfield3,"title":plgdfield3 },
            { "data": "lgdfld4", "name":plgdfield4,"title":plgdfield4 }
        ]}
	);
	myLegend.columns( '.detail' ).visible( true );
	$("#maxdisp").val("10");
	$("#refreshtime").val("3");

} );

$("#selectdb").focusin(function(){
		var dbf = $("#selectdb option:selected").text();
		$.post('/tablelist',{'data':dbf},function(data){
			$('#selecttable').empty();
			$.each(data,function(i,val){
				$('#selecttable').append('<option>'+i+'</option>');
			});
		},'json');

	}
);

$("#activemap").change(function(){
	if  ($(this).is(":checked") ) {
		mapactive = "yes";
		$("#mapparam1").show();
		$("#mapparam2").show();
	}
	else {
		mapactive = "no";
		$("#mapparam1").hide();
		$("#mapparam2").hide();
	}

});

$("#groupby").change(function(){
	if  ($(this).is(":checked") ) {
		groupby = "yes";
		$("#grpbydiv").show();
	}
	else {
		groupby = "no";
		$("#grpbydiv").hide();
	}

});

$("#selecttable").focusin(function(){
	var db = $("#selectdb option:selected").text();
	var table = $("#selecttable option:selected").text();
	$.post('/collist',{'db':db,'table':table},function(data){
		$('#lat').empty();
		$('#long').empty();
		$('#lgdfield1').empty();
		$('#lgdfield2').empty();
		$('#lgdfield3').empty();
		$('#lgdfield4').empty();
		$('#groupbyparam').empty();
		$.each(data,function(i,val){
			$('#lat').append('<option>'+i+'</option>');
			$('#long').append('<option>'+i+'</option>');
			$('#lgdfield1').append('<option>'+i+'</option>');
			$('#lgdfield2').append('<option>'+i+'</option>');
			$('#lgdfield3').append('<option>'+i+'</option>');
			$('#lgdfield4').append('<option>'+i+'</option>');
			$('#groupbyparam').append('<option>'+i+'</option>');
		});
	},'json');

	}
);

$("#btnsub").click(function()
	{
		maxHistory = $("#maxdisp").val();
		refreshinterval = $("#refreshtime").val();
		pdb = $("#selectdb option:selected").text();
		ptable = $("#selecttable option:selected").text();
		plat = $("#lat option:selected").text();
		plong = $("#long option:selected").text();
		plgdfield1 = $("#lgdfield1 option:selected").text();
		plgdfield2 = $("#lgdfield2 option:selected").text();
		plgdfield3 = $("#lgdfield3 option:selected").text();
		plgdfield4 = $("#lgdfield4 option:selected").text();
		myLegend.destroy();
		$('#legend').empty();
		myLegend = $('#legend').DataTable(
		{"columns": [
	            { "data": "lgdfld1", "name":plgdfield1,"title":plgdfield1 },
	            { "data": "lgdfld2", "name":plgdfield2,"title":plgdfield2 },
	            { "data": "lgdfld3", "name":plgdfield3,"title":plgdfield3 },
	            { "data": "lgdfld4", "name":plgdfield4,"title":plgdfield4 }
	        ]}
		);
		myLegend.columns( '.detail' ).visible( true );
		myLegend.clear().draw();
		refreshmap();
		intertimer = 0;
	}
);


$.getJSON('/initHome',function(data){
				var updatedOptions = {
					'areas' : {},
					'plots' : {}
				};
				$(".container1").trigger('update',
					[updatedOptions,data,[],{animDuration:1000}]
				)
});

setInterval(function(){
	if (mapactive == "yes"){
		if (intertimer >= refreshinterval){
			intertimer = 1;
			refreshmap();
		}
		else {
			intertimer += 1;
		}
	}		
},1000);

setInterval(function(){
		if(linksHistory.length > maxHistory){
			var plotsToDelete = [];
			var linksToDelete = [];
			for(i = 0; i <= (linksHistory.length-maxHistory); i++){
				plotsToDelete.push(plotsHistory[0]);
				plotsHistory.shift();
				linksToDelete.push(linksHistory[0]);
				linksHistory.shift();
			}
			var updatedOptions = {
				'areas' : {},
				'plots' : {},
				'links' : {}
			};
			var opt = {
				'animDuration' : 1000,
				'deletedLinks' : linksToDelete
			};
			$(".container1").trigger('update',
				[updatedOptions,[],plotsToDelete,opt]
			);
		}

},1000);


function initmap(){
$(".container1").mapael({
	map : {
		name : "world_countries",
		defaultArea: {
			attrs : {
				fill : "#000000"
					, stroke: "#0000ff"
			}
		}
		, zoom : {
                enabled : true
		}
            // Default attributes can be set for all links
            , defaultLink: {
                factor : 0.4,
		stroke : 'red',
                attrsHover : {
                    stroke: "#ffffff"
                }
            }
            , defaultPlot : {
		size : 5,
		attrs : {
			fill : "#89ff72"
		},
                text : {
                    attrs : {
                        fill:"#000"
                    }, 
                    attrsHover : {
                        fill:"#000"
                    }
                }
            }
	},        
});
}

function refreshmap(){
	var updatedOptions = {
				'areas' : {},
				'plots' : {}
			};
			$.post('/refresh',{
				'pdb':pdb,
				'ptable':ptable,
				'plat':plat,
				'plong':plong,
				'ptime':refreshinterval,
				'pgrpby':groupby,
				'pgrpbyfld':groupbyfield,
				'plgdfield1':plgdfield1,
				'plgdfield2':plgdfield2,
				'plgdfield3':plgdfield3,
				'plgdfield4':plgdfield4
				}
			,function(data){
				if (data.status == 'error'){
					$("#alertmsg").text('Error : '+data.error);
					$("#alertmsg").attr('style','');
				}
				if (data.status == 'success'){
					$("#alertmsg").text('ok');
					$("#alertmsg").attr('style','display: none;');
				}
				var opt = {
					animDuration : 1000,
					newLinks : data.newLinks
				};
				$(".container1").trigger('update',
					[updatedOptions,data.plots,[],opt]
				);
				for(var l in data.newLinks) { 
						linksHistory.push(l); 
				}
				for(var l in data.plots) { 
						plotsHistory.push(l); 
				}
				myLegend.rows.add(data.myLegend).draw();
			},'json');

}

