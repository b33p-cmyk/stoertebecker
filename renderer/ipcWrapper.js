// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import {error } from './logger.js'; 

export async function ipc(call) {
  const result = await call;

  if (!result.success) {
    error(result.error.message);
    throw result.error;
  }
  
  return result.data;
}