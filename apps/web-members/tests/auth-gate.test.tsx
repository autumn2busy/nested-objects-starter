import { test, mock } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { Gate } from '../components/Gate'
import * as authProvider from '../components/auth-provider'

test('Gate renders fallback when user is unauthenticated', () => {
  mock.method(authProvider, 'useAuth', () => ({
    hasAccess: () => false,
    isLoading: false,
    isAuthenticated: false,
    login: () => undefined,
    signup: () => undefined,
  }))

  const html = renderToStaticMarkup(
    React.createElement(Gate, {
      fallback: React.createElement('div', null, 'login required'),
      children: React.createElement('div', null, 'secret content'),
    }),
  )

  assert.ok(html.includes('login required'))
  assert.ok(!html.includes('secret content'))

  mock.restoreAll()
})

test('Gate renders children when authenticated and authorized', () => {
  mock.method(authProvider, 'useAuth', () => ({
    hasAccess: () => true,
    isLoading: false,
    isAuthenticated: true,
    login: () => undefined,
    signup: () => undefined,
  }))

  const html = renderToStaticMarkup(
    React.createElement(Gate, {
      feature: 'ai_concierge',
      children: React.createElement('div', null, 'authorized content'),
    }),
  )

  assert.ok(html.includes('authorized content'))

  mock.restoreAll()
})
