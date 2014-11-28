define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<td colspan=\"2\">\n    <div class=\"comment-header\">\n    	<span class=\"add-comment\"><a href=\"#\" class=\"add-comment\">add comment</a></span>\n    	<textarea style=\"display: none;\" class=\"input-block-level focused hide\" id=\"focusedInput\" placeholder=\"Write a comment for this annotation.\"></textarea>\n    	<div class=\"button-bar\">\n    		<button type=\"button\" class=\"btn hide\">Cancel</button>\n    		<button type=\"submit\" class=\"btn btn-primary hide\">Insert</button>\n    	</div>\n    </div>\n    <div id=\"comment-list";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"comment-list\"></div>\n</td>";
  return buffer;
  })

});