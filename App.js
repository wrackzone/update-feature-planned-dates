var app = null;

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    // items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc2/doc/">App SDK 2.0rc2 Docs</a>'},
    launch: function() {

    	app = this;


    	app.showMask("Loading configuration data...");
        this.rallyFunctions = Ext.create("RallyFunctions",{ 
            ctx : this.getContext(),
        	keys : ['iterations','releases']
        });

        this.rallyFunctions.readRallyItems().then( {
        	success : function(bundle) {
	            app.bundle = bundle;
    	        var filter = app._createReleaseFilter();

    	        app.showMask("Loading features...");
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
    	_.each(releases,function(r,i){
    		var f = Ext.create('Rally.data.wsapi.Filter', {
		    	property: 'Release',
	     		operator: '=',
	     		value: r.get("_ref")
     		})
     		filter = i == 0 ? f : filter.or(f)
    	});
    	return filter;
    },

	_onStoreBuilt: function(store) {
		console.log("_onStoreBuilt");
		app.earliestIndex = 9;
		app.latestIndex = 10;
		app.hideMask();
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
	            'Project',
	            'Release',
	            'Iteration',
	            'PlannedStartDate',
	            'PlannedEndDate',
	            'LeafStoryCount',
	            {
	            	header : 'Planned / Unplanned Count',   
                	dataIndex : 'Parent', 
                	width : 50,
                	hidden : false,
                	renderer : app.renderCustomColumn
	            },
	            {
	            	header : '% Planned',   
                	dataIndex : 'Parent', 
                	width : 50,
                	hidden : false,
                	renderer : app.renderPercentPlanned
	            },

	            {
	            	header : 'Earliest Planned',   
                	dataIndex : 'Parent', 
                	width : 75,
                	hidden : false,
                	renderer : app.renderEarliestDate
	            },
	            {
	            	header : 'Latest Planned',   
                	dataIndex : 'Parent', 
                	width : 75,
                	hidden : false,
                	renderer : app.renderLatestDate
	            }
	            // {
	            // 	header : 'Update',   
             //    	dataIndex : 'Parent', 
             //    	width : 75,
             //    	hidden : false,
             //    	renderer : app.renderUpdateButton
	            // },
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

    calcPercentPlanned : function(planned,rec) {

    	var lsc = rec.get("LeafStoryCount") || 0;
		var pp = (lsc > 0 && planned.length > 0) ? ((planned.length / lsc) * 100) : 0
		// console.log("calc:",rec.get("FormattedID"),planned.length,lsc,pp);
		return Math.round(pp);

    },

    renderUpdateButton : function(value,meta,rec) {
    
    	var val = rec.get("Button");

    	if (!_.isUndefined(val))
    		return val;
    	// if (rec.get("Button")==true)
    	// 	return;
        var id = Ext.id();
        Ext.defer(function () {
            Ext.widget('button', {
                renderTo: id,
                text: 'Update',
                width: 75,
                handler: function () { 
                	console.log('Info', rec.get('Name')); 
                }
            });
        }, 50);
        var val = Ext.String.format('<div id="{0}"></div>', id);
        rec.set("Button",val);
        return val;
    },

    renderPercentPlanned : function(value,meta,rec) {

    	if (_.isUndefined(rec.get("PercentPlanned"))) {
    		return "..."
    	} else {
    		return rec.get("PercentPlanned");
    	}
    },

    renderEarliestDate : function(value,meta,r,a,colIndex,c) {
		value = r.get("Earliest");
    	if (_.isUndefined(value)) {
    		return "..."
    	} else {
			var diff = Rally.util.DateTime.getDifference(value,r.get("PlannedStartDate"),'day');
			if (Math.abs(diff) > 0 ) {
				meta.style = "background-color:LemonChiffon;";
			}
    		return value.toISOString().slice(0, 10);;
    	}
    },

    renderLatestDate : function(value,meta,r,a,colIndex,c) {
		value = r.get("Latest");
    	if (_.isUndefined(value)) {
    		return "..."
    	} else {
			var diff = Rally.util.DateTime.getDifference(value,r.get("PlannedEndDate"),'day');
			// console.log("Diff",value,r.get("PlannedEndDate"),r.get("FormattedID"),diff);
			if (Math.abs(diff) > 0 ) {
				meta.style = "background-color:LemonChiffon;";
			}   
    		return value.toISOString().slice(0, 10);;
    	}
    },

    renderCustomColumn : function(value,meta,r) {
      	
      	if (r.get("_type")=="portfolioitem/feature") {
      		var up =  r.get("Unplanned");
      		var p = r.get("Planned");
      		if (_.isUndefined(up)||_.isUndefined(p)) {
      			var itemId = Ext.id();
		        Ext.defer(app.readStories,500, app, [value,itemId,r]);
		        return('...');
      		} else {
      			if (p.length == 0 && up.length > 0) {
			    	meta.style = "background-color:tomato;";
      			}
      			if (p.length > 0 && up.length == 0) {
			    	meta.style = "background-color:LightGreen;";
      			}

      			return ""+p.length+ " / " + (!_.isUndefined(p) ? up.length : 0);
      		}
      	}
  		return "-";

	},

	unplannedStories : function(list) {

		var filteredList = _.filter(list,function(rec) {
					return rec.get("_type") == "hierarchicalrequirement" &&
						rec.get("Children").Count == 0 &&
					(_.isNull(rec.get("Iteration")) || _.isUndefined(rec.get("Iteration")))
		});
		return filteredList;
	},

	plannedStories : function(list) {
		var filteredList = _.filter(list,function(rec) {
					return rec.get("_type") == "hierarchicalrequirement" &&
						rec.get("Children").Count == 0 &&
					(!(_.isNull(rec.get("Iteration")) || _.isUndefined(rec.get("Iteration"))))
		});
		return filteredList;
	},


	readStories : function(value,itemId,rec) {

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
				rec.set("PercentPlanned", app.calcPercentPlanned(planned,rec));
			}
		}
		)
	},
	showMask: function(msg) {
        if ( this.getEl() ) { 
            this.getEl().unmask();
            this.getEl().mask(msg);
        }
    },
    hideMask: function() {
        this.getEl().unmask();
    }

});
