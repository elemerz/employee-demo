/*globals dust, console*/
/*jshint browser: true, jquery: true, white:false, smarttabs: true, expr: true*/

(function($, NS) {
	'use strict';
	window[NS] = {
	  /** Data model. */
	  model : {
		  employees : []
	  },
	  /** Map for view t5emplates. */
	  viewTemplates : {},
	  i18n : {'lblDeleteConfirmation':'Do you really wanna delete the employee?'},

	  init : function() {
		  var $d = $(document);

		  $d.on('click', '#btnLoadEmployees', {
			  url : 'stage/data/db/employees.json'
		  }, $.proxy(this.loadEmployees, this));

		  $d.on('click', 'section:not(.editing) .toolbar button.add', $.proxy(this.addNew, this));
		  $d.on('click', 'section:not(.editing) .toolbar button.edit', $.proxy(this.openEditor, this));
		  $d.on('click', 'section:not(.editing) .toolbar button.delete', $.proxy(this.delete, this).intercept(this.askForConfirmation, this,this.i18n.lblDeleteConfirmation));
		  $d.on('click', '.editor button.save', $.proxy(this.saveChanges, this));
		  $d.on('click', '.editor button.reset', $.proxy(this.resetChanges, this));
		  $d.on('click', '.editor button.cancel', $.proxy(this.cancelChanges, this));
		  $d.on('keypress', '.editor', $.proxy(this.doDefaultEditorAction, this));

		  this.preloadTemplates([ 'employees', 'employee-view', 'employee-edit' ]);
	  },
	  /** Pre-Load templates */
	  preloadTemplates : function(arrTmplnames) {
		  var self = this, view = arrTmplnames.shift(), loadView = function(view) {
			  var $node = $('<div id="temp-' + ("" + Math.random()).substr(2) + '"></div>');
			  $node.load('stage/data/view/{view}.html'.tmpl({
				  view : view
			  }), function(txt) {
				  self.viewTemplates[view] = txt;
				  view = arrTmplnames.shift();
				  if (view) {
					  loadView(view);
				  } else {
					  self.precompileTemplates();
				  }
			  });
		  };

		  if (view) {
			  loadView(view);
		  }
	  },

	  /** Pre-compile templates for higher performance. */
	  precompileTemplates : function() {
		  $.each(this.viewTemplates, function(templateId, templateContent) {
			  dust.loadSource(dust.compile(templateContent, templateId));
		  });
	  },

	  /**
		 * Loads the employee list from the specified url (a static JSON "database").
		 */
	  loadEmployees : function(e) {
		  $.ajax({
		    context : this,
		    url : e.data.url,
		    contentType : "application/json; charset=utf-8", /* send to server */
		    dataType : "json", /* expect from server */
		    success : function(employees) {
			    this.model.employees = employees;
			    $(".employees>ul").rerender({
			      view : 'employees',
			      model : this.model,
			      mode : 'replaceWith'
			    });
		    }
		  });
	  },

	  /** Adds a new employee, */
	  addNew : function() {
		  console.log('Add a new employee.');
		  var newEmployee = {
		    "id" : '-1',
		    "name" : '',
		    "vorname" : '',
		    "role" : "Developer",
		    "mode" : "edit",
		    "action" : "add"
		  };

		  $('.employees>ul').rerender({
		    'view' : 'employee-edit',
		    'model' : newEmployee,
		    'mode' : (this.model.employees.length ? 'append' : 'html'),
		    'onAfter' : this.onEditorOpened
		  });
	  },
	  
	  /** Inserts the employee editor in place of the edited item. */
	  openEditor : function(e) {
      var $li = $(e.target).closest('li'),
      id = $li.attr('data-id'),
      employee = $.extend(this.findEmployeeById(this.model.employees, id),{'action':'change'});
      
		  $li.rerender({
		    'view' : 'employee-edit',
		    'model' : employee,
		    'mode' : 'replaceWith',
		    'onAfter' : this.onEditorOpened
		  });
	  },
	  
	  /** Called right after the editor has been opened. */
	  onEditorOpened : function() {
			console.log('Editor displayed.');
			$('.editor input:first').focus();
			$('.employees').addClass('editing');
	  },
	  
	  /** Called right after editor has been closed. */
	  onEditorClosed: function(){
	  	console.log('Editor closed.');
	  	$('.employees').removeClass('editing');
	  },
	  
	  /** Executes the default action in editor. (The button having data-default attribute present) */
	  doDefaultEditorAction : function(e) {
		  if (e.ctrlKey && e.keyCode === 13) {
			  $(e.target).closest('.editor').find('[data-default]').trigger('click');
		  }
	  },
	  /** Save button clicked inside editor. */
	  saveChanges : function(e) {
		  console.log('Save & close editor.');
		  var $editor = $(e.target).closest('.editor'), $form=$editor.find('form'),id = $editor.attr('data-id'), employee = (id !== '-1' ? this.findEmployeeById(this.model.employees, id) : this.newEmployee(this.model.employees));
		  if(!$form.valid()){return false;}

		  $editor.updateModel({
			  'model' : employee
		  });

		  $editor.rerender({
		    'view' : 'employee-view',
		    'model' : employee,
		    'mode' : 'replaceWith',
		    'onAfter': this.onEditorClosed
		  });
	  },

	  /** Reset button clicked inside editor. */
	  resetChanges : function(e) {
		  console.log('Reset editor values.');
		  $(e.target).closest('.editor').find('form')[0].reset();
	  },

	  /** Cancel button clicked inside editor. */
	  cancelChanges : function(e) {
		  console.log('Cancelling edit');
		  var $editor = $(e.target).closest('.editor'), id = $editor.attr('data-id'), model = this.findEmployeeById(this.model.employees, id);

		  if (!model) {// model not found==> we are adding a New item
			  $('.employees>ul').rerender({
			    'view' : 'employees',
			    'model' : this.model,
			    'mode' : 'replaceWith',
			    'onAfter':this.onEditorClosed
			  });
		  } else {
			  $editor.rerender({
			    'view' : 'employee-view',
			    'model' : model,
			    'mode' : 'replaceWith',
		    	'onAfter':this.onEditorClosed
			  });
		  }
	  },

	  /** Return true if you confirm the action. */
	  askForConfirmation : function(msg) {
		  return window.confirm(msg);
	  },
	  /** Deletes an existing employee. */
	  'delete' : function(e) {
		  var $employee = $(e.target).closest('li'), id = String($employee.data('id'));
		  // Call Ajax delete service at this point. In "success":
		  this.deleteById(this.model.employees, id);
		  $(".employees>ul").rerender({
		    view : 'employees',
		    model : this.model,
		    mode : 'replaceWith'
		  });
	  },

	  /** *** Model manipulation methods.**** */
	  /** Finds an employee with the given index. If not found==> return -1 */
	  findIndexById : function(arr, id) {
		  for ( var l = arr.length, i = 0; i < l; i++) {
			  if (id === arr[i].id) {
				  return i;
			  }
		  }
		  return -1;
	  },
	  /** Locates an Employee by id */
	  findEmployeeById : function(arr, id) {
		  return arr[this.findIndexById(arr, id)];
	  },
	  /** Deletes an employee bu id. */
	  deleteById : function(arr, id) {
		  var idx = this.findIndexById(arr, id);
		  (idx !== -1) && arr.splice(idx, 1);
	  },
	  /** Returns a default empty Employee instance. */
	  newEmployee : function(model) {
		  model.push({
		    'id' : ('' + Math.random()).substr(2, 5),
		    'name' : '',
		    'vorname' : '',
		    'role' : 'developer',
		    'mode' : 'view'
		  });
		  return model[model.length - 1];
	  }
	};

	/** *** jQuery extensions **** */
	$.fn.extend({
	  /** * re-rendera a component.** */
	  rerender : function(options) {
		  var defaults = {
		    'view' : '',
		    /** the view template to be rendered */
		    'model' : {},
		    /** the model object to be merged into the view */
		    'mode' : 'html',
		    /** How the neew content will relate to the container. possible values: html|append|prepend|replaceWith */
		    'onAfter' : null
		  /** callback function to be called on after render is done. */
		  }, cfg = $.extend({}, defaults, options);

		  return this.each(function() {
			  var $container = $(this);

			  dust.render(cfg.view, cfg.model, function(err, out) {
				  if (!err) {
					  $container[cfg.mode](out);
					  if ($.isFunction(cfg.onAfter)) {
						  cfg.onAfter(cfg.model);
					  }
				  } else {
					  throw err;
				  }
			  });
		  });
	  },

	  /** Takes values from fields having data-bindto attribute set and writes them into corresponding model fields. */
	  updateModel : function(options) {
		  var defaults = {
			  'model' : {}
		  }, cfg = $.extend({}, defaults, options), $t = $(this), model = cfg.model, $boundNodes = $t.find('[data-bindto]');
		  $boundNodes.each(function() {
			  var $node = $(this), boundField = $node.attr('data-bindto'), fieldValue = $node.val();
			  if (model.hasOwnProperty(boundField)) {
				  model[boundField] = fieldValue;
			  } else {
				  throw "Field not found in model: " + boundField;
			  }
		  });
		  return model;
	  }
	});

	/** Add methods to native objects. */
	/** ** Extend JS natives. :) **** */
	Function.prototype.method = function(name, fnc) {
		if (this.prototype[name] === undefined) {
			this.prototype[name] = fnc;
		}
		return this;
	};

	/**
	 * Makes possible for any Function object to be intercepted by the passed function argument. If the interceptor function returns falsy==> the original one does NOT get called.
	 */
	Function.method('intercept', function(fn, scope,message) {
			var original=this;
			scope = scope || {};
			message = message || 'Are you sure?';
			return function() {
				return fn.apply(scope, [message]) && original.apply(scope, arguments);
			};
	});

	/** Client-side templating method. */
	String.method('tmpl', function(obj) {
		var prop, result = this;

		for (prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				result = result.replace(new RegExp('{' + prop + '}', 'g'), obj[prop]);
			}
		}
		return result;
	});

	/* Attach page specific behavior on page load */
	$(function() {
		window[NS].init();
	});
}(jQuery, "BDB"));