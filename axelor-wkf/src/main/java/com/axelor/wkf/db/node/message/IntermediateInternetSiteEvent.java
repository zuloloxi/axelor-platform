/**
 * Copyright (c) 2012-2014 Axelor. All Rights Reserved.
 *
 * The contents of this file are subject to the Common Public
 * Attribution License Version 1.0 (the “License”); you may not use
 * this file except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://license.axelor.com/.
 *
 * The License is based on the Mozilla Public License Version 1.1 but
 * Sections 14 and 15 have been added to cover use of software over a
 * computer network and provide for limited attribution for the
 * Original Developer. In addition, Exhibit A has been modified to be
 * consistent with Exhibit B.
 *
 * Software distributed under the License is distributed on an “AS IS”
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is part of "Axelor Business Suite", developed by
 * Axelor exclusively.
 *
 * The Original Developer is the Initial Developer. The Initial Developer of
 * the Original Code is Axelor.
 *
 * All portions of the code written by Axelor are
 * Copyright (c) 2012-2014 Axelor. All Rights Reserved.
 */
package com.axelor.wkf.db.node.message;

import javax.persistence.Entity;

import com.axelor.db.JPA;
import com.axelor.db.Query;
import com.axelor.wkf.db.node.IntermediateMessageEvent;

@Entity
public class IntermediateInternetSiteEvent extends IntermediateMessageEvent {
	
	/**
	 * Find a <code>IntermediateInternetSiteEvent</code> by <code>id</code>.
	 *
	 */
	public static IntermediateInternetSiteEvent find(Long id) {
		return JPA.find(IntermediateInternetSiteEvent.class, id);
	}
	
	/**
	 * Return a {@link Query} instance for <code>IntermediateInternetSiteEvent</code> to filter
	 * on all the records.
	 *
	 */
	public static Query<IntermediateInternetSiteEvent> allIntermediateInternetSiteEvent() {
		return JPA.all(IntermediateInternetSiteEvent.class);
	}
	
	/**
	 * A shortcut method to <code>IntermediateInternetSiteEvent.all().filter(...)</code>
	 *
	 */
	public static Query<IntermediateInternetSiteEvent> filterIntermediateInternetSiteEvent(String filter, Object... params) {
		return JPA.all(IntermediateInternetSiteEvent.class).filter(filter, params);
	}
	
}
