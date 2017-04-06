var app = null;

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc2/doc/">App SDK 2.0rc2 Docs</a>'},
    launch: function() {

    	app = this;


        this.rallyFunctions = Ext.create("RallyFunctions",{ 
            ctx : this.getContext(),
        	keys : ['iterations','releases']
        });

        this.rallyFunctions.readRallyItems().then( {
        	success : function(bundle) {
	            app.bundle = bundle;
    	        console.log("app.bundle",bundle);
    	        var filter = app._createReleaseFilter();

    	        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
				    models: ['portfolioitem/feature'],
				    autoLoad: true,
				    enableHierarchy: true,
				    filters : [filter]
				}).then({
				    success: app._onStoreBuilt,
				    scope: app
				});
        	}
        });

    },
    _createReleaseFilter : function() {
    	var today = new Date();
    	var filter;
    	var releases = _.filter(app.bundle.releases,function(release) {
    		return Rally.util.DateTime.fromIsoString(release.raw["ReleaseStartDate"]) <= today
    		&& Rally.util.DateTime.fromIsoString(release.raw["ReleaseDate"]) >= today ;
    	})
    	console.log("releases",releases.length);
    	_.each(releases,function(r,i){
    		var f = Ext.create('Rally.data.wsapi.Filter', {
		    	property: 'Release',
	     		operator: '=',
	     		value: r.get("_ref")
     		})
     		filter = i == 0 ? f : filter.or(f)
    	});
    	console.log(filter.toString());
    	return filter;
    },

	_onStoreBuilt: function(store) {
		console.log("_onStoreBuilt");
		app.earliestIndex = 9;
		app.latestIndex = 10;

	    app.add({
	        xtype: 'rallytreegrid',
	        store: store,
	        context: app.getContext(),
	        enableEditing: false,
	        enableBulkEdit: false,
	        shouldShowRowActionsColumn: false,
	        enableRanking: false,
	        columnCfgs: [
	            'Name',
	            'Owner',
	            'PlannedStartDate',
	            'PlannedEndDate',
	            'LeafStoryCount',
	            'Release',
	            'Iteration',
	            {
	            	header : 'Unplanned Stories',   
                	dataIndex : 'Parent', 
                	width : 50,
                	hidden : false,
                	renderer : app.renderCustomColumn
	            },
	            {
	            	header : 'Earliest Planned',   
                	dataIndex : 'Parent', 
                	width : 75,
                	hidden : false,
                	renderer : app.renderPlannedDate
	            },
	            {
	            	header : 'Latest Planned',   
                	dataIndex : 'Parent', 
                	width : 75,
                	hidden : false,
                	renderer : app.renderPlannedDate
	            }
	        ]
	    });
    },

    calcEarliestAndLatest : function(planned) {

		var startDates = _.sortBy(_.map(planned,function(story) {
			var i = _.find(app.bundle.iterations,function(it) {
				return it.get("_ref") == story.get("Iteration")._ref;
			});
			return Rally.util.DateTime.fromIsoString(i.raw["StartDate"]);
		}));

		var endDates = _.sortBy(_.map(planned,function(story) {
			var i = _.find(app.bundle.iterations,function(it) {
				return it.get("_ref") == story.get("Iteration")._ref;
			});
			return Rally.util.DateTime.fromIsoString(i.raw["EndDate"]);
		}))

		return {
			earliest : _.first(startDates),
			latest : _.last(endDates)
		}

    },

    renderPlannedDate : function(value,id,r,a,colIndex,c) {

    	if (colIndex==9)
    		value = r.get("Earliest");
    	else
    		value = r.get("Latest");

    	if (_.isUndefined(value)) {
    		return "..."
    	} else {
    		return value.toISOString().slice(0, 10);;
    	}
    },



    renderCustomColumn : function(value,id,r) {
      	
      	// console.log('r',r,r.get("_type"));
      	if (r.get("_type")=="portfolioitem/feature") {
      		var up =  r.get("Unplanned");
      		var p = r.get("Planned");
      		if (_.isUndefined(up)) {
      			var itemId = Ext.id();
		        Ext.defer(app.readStories,500, app, [value,itemId,r]);
		        return('...');
      		} else {
      			return ""+up.length+ "/" + (!_.isUndefined(p) ? r.get("Planned").length : 0);
      		}
      	}
  		return "-";

	},

	unplannedStories : function(list) {
		// console.log("list",list,list.length);
		var filteredList = _.filter(list,function(rec) {
					// console.log(rec.get("_type"),rec.get("Children"));
					return rec.get("_type") == "hierarchicalrequirement" &&
						rec.get("Children").Count == 0 &&
					(_.isNull(rec.get("Iteration")) || _.isUndefined(rec.get("Iteration")))
		});
		return filteredList;
	},

	plannedStories : function(list) {
		// console.log("list",list,list.length);
		var filteredList = _.filter(list,function(rec) {
					// console.log(rec.get("_type"),rec.get("Children"));
					return rec.get("_type") == "hierarchicalrequirement" &&
						rec.get("Children").Count == 0 &&
					(!(_.isNull(rec.get("Iteration")) || _.isUndefined(rec.get("Iteration"))))
		});
		return filteredList;
	},


	readStories : function(value,itemId,rec) {
		// console.log("readstories",value,itemId,rec)

		this.rallyFunctions.recurseObject(rec) .then({
			success : function(list) {
				// filter to just stories which have no iteration
				var unplanned = app.unplannedStories(list);
				var planned = app.plannedStories(list);
				rec.set("Unplanned",unplanned);
				rec.set("Planned", planned);
				var elDates = app.calcEarliestAndLatest(planned);
				rec.set("Earliest", elDates.earliest);
				rec.set("Latest",elDates.latest);
			}
		}
		)
	}

});
