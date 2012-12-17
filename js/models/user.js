/**
 *  Copyright 2012, Entwine GmbH, Switzerland
 *  Licensed under the Educational Community License, Version 2.0
 *  (the "License"); you may not use this file except in compliance
 *  with the License. You may obtain a copy of the License at
 *
 *  http://www.osedu.org/licenses/ECL-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an "AS IS"
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 *  or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 *
 */
    
define(["order!jquery",
        "order!roles",
        "order!underscore",
        "order!backbone"],
       
    function($, ROLES) {

        "use strict";
    
        /**
         * User model
         * @class
         */
        var User = Backbone.Model.extend({
            
            defaults: {
                role: ROLES.USER
            },
            
            initialize: function(attr) {
                if (_.isUndefined(attr.user_extid) || attr.user_extid === "" ||
                   _.isUndefined(attr.nickname) || attr.nickname === "") {
                    throw "'user_extid' and 'nickanme' attributes are required";
                }
                
                // Check if the category has been initialized 
                if (!attr.id) {
                    // If local storage, we set the cid as id
                    if (window.annotationsTool.localStorage) {
                        attr.id = this.cid;
                    }
                        
                    this.toCreate = true;
                }
                
                if (annotationsTool.getUserRole) {
                    attr.role = annotationsTool.getUserRole();

                    if (!attr.role) {
                        delete attr.role;
                    }
                }

                this.set(attr);
                
                // Define that all post operation have to been done through PUT method
                // see in wiki
                this.noPOST = true;
            },
            
            parse: function(data) {    
                var attr = data.attributes ? data.attributes : data;

                attr.created_at = attr.created_at !== null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at !== null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at !== null ? Date.parse(attr.deleted_at): null;

                if (data.attributes) {
                    data.attributes = attr;
                } else {
                    data = attr;
                }

                return data;
            },
            
            validate: function(attr) {
                var tmpCreated;

                if (attr.id) {
                    if (this.get('id') !== attr.id) {
                        this.id = attr.id;
                    }
                }
                
                if (_.isUndefined(attr.user_extid) || (!_.isString(attr.user_extid) && !_.isNumber(attr.user_extid))) {
                    return {attribute: "user_extid", message: "'user_extid' must be a valid string or number."};
                }
                
                if (_.isUndefined(attr.nickname) || !_.isString(attr.nickname)) {
                    return {attribute: "nickname", message: "'nickanme' must be a valid string!"};
                }
    
                if (attr.email && !User.validateEmail(attr.email)) {
                    return {attribute: "email", message: "Given email is not valid!"};
                }
                
                if (attr.created_by && !(_.isNumber(attr.created_by) || attr.created_by instanceof User)) {
                    return "'created_by' attribute must be a number or an instance of 'User'";
                }
                
                if (attr.updated_by && !(_.isNumber(attr.updated_by) || attr.updated_by instanceof User)) {
                    return "'updated_by' attribute must be a number or an instance of 'User'";
                }
                
                if (attr.deleted_by && !(_.isNumber(attr.deleted_by) || attr.deleted_by instanceof User)) {
                    return "'deleted_by' attribute must be a number or an instance of 'User'";
                }
                
                if (attr.created_at) {
                    if ((tmpCreated=this.get('created_at')) && tmpCreated!==attr.created_at){
                        return "'created_at' attribute can not be modified after initialization!";
                    } else if (!_.isNumber(attr.created_at)) {
                        return "'created_at' attribute must be a number!";
                    }
                }
        
                if (attr.updated_at) {
                    if (!_.isNumber(attr.updated_at)) {
                        return "'updated_at' attribute must be a number!";
                    }
                }

                if (attr.deleted_at) {
                    if (!_.isNumber(attr.deleted_at)) {
                        return "'deleted_at' attribute must be a number!";
                    }
                }
            }
            
        },
        // Class properties and functions
        {
            /**
             * Check if the email address has a valid structure
             *
             * @param {String} email the email address to check
             * @return {Boolean} true if the address is valid
             */
            validateEmail: function(email) { 
                var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(email);
            }
        });
        
        return User;
    
});