"use server";

import * as adminActions from "./admin_actions";

export async function deleteCustomer(id: string) {
  return adminActions.deleteCustomer(id);
}
