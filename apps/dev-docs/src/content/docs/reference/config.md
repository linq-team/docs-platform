---
title: Stainless config schema
---

Use the content below for detailed understanding of the Stainless configuration file, its supported keys, their types, and their values.

<details>

<summary>Example OpenAPI spec</summary>

```yaml
# We support 3.X formats. Read about the difference between 3.0 and 3.1
# at https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
openapi: 3.1.0

# Information in this section is used in the initial guess of the Stainless config, but not read afterwards.
# For example, contact.email is used in the initial guess of the Stainless config for determining
# `organization.contact`, which is linked to in each of the SDKs' README.md.
info:
  title: Acme Developer API
  description: >
    The Acme Developer API is designed to provide a predictable programmatic
    interface for accessing your Acme account through an API and transaction
    webhooks.
  version: 1.0.0
  termsOfService: "https://acme.com/legal#terms"
  contact:
    email: support@acme.com

# The servers here is used in the initial guess of the Stainless config for determining `environments` which
# allows users to change between various base URLs easily.
servers:
  - url: https://api.acme.com/v1
    description: Acme production API server
  - url: https://sandbox.acme.com/v1
    description: Sandbox environment that provides key functionality mirroring production

# Tags are not used by Stainless, but are recommended for other OpenAPI tools and book-keeping.
tags:
  - name: Account
  - name: Friends
  - name: Status

# Paths define the endpoints and methods, their request/response types, and more.
paths:
  /accounts:
    get:
      tags:
        - Account
      summary: List account
      description: List account
      parameters:
        - $ref: "#/components/parameters/Cursor"
        - $ref: "#/components/parameters/Limit"
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: "#/components/schemas/PaginationResponse"
                  - type: object
                    properties:
                      data:
                        type: array
                        items:
                          $ref: "#/components/schemas/Account"
    post:
      tags:
        - Account
      summary: Create account
      description: Create account
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Account"
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Account"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"
        "422":
          $ref: "#/components/responses/UnprocessableEntity"
        "429":
          $ref: "#/components/responses/TooManyRequests"

  /accounts/{account_id}:
    get:
      tags:
        - Account
      summary: Get account
      description: Get account
      parameters:
        - $ref: "#/components/parameters/AccountID"
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AccountConfiguration"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"
        "422":
          $ref: "#/components/responses/UnprocessableEntity"
        "429":
          $ref: "#/components/responses/TooManyRequests"
    put:
      tags:
        - Account
      summary: Update account
      description: |
        Update account configuration.
      parameters:
        - $ref: "#/components/parameters/AccountID"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Account"
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Account"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"
        "422":
          $ref: "#/components/responses/UnprocessableEntity"
        "429":
          $ref: "#/components/responses/TooManyRequests"
  /accounts/{account_id}/link:
    post:
      tags:
        - Account
      summary: Link account to external account
      description: Link account to external account, such as a Google or Facebook Account
      parameters:
        - $ref: "#/components/parameters/AccountID"
        - $ref: "#/components/parameters/IdempotencyKey"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/AccountLink"
            examples:
              GoogleAccount:
                account_type: "google"
                google_account_id: "123456789"
              FacebookAccount:
                account_type: "facebook"
                google_account_id: "123456789"
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AccountLink"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"
        "422":
          $ref: "#/components/responses/UnprocessableEntity"
        "429":
          $ref: "#/components/responses/TooManyRequests"
  /accounts/{account_id}/friends:
    get:
      tags:
        - Friends
      summary: Get friends for this an account
      parameters:
        - $ref: "#/components/parameters/AccountID"
        - $ref: "#/components/parameters/Cursor"
        - $ref: "#/components/parameters/Limit"
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: "#/components/schemas/PaginationResponse"
                  - type: object
                    properties:
                      data:
                        type: array
                        items:
                          $ref: "#/components/schemas/FriendResponse"

        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"
        "422":
          $ref: "#/components/responses/UnprocessableEntity"
        "429":
          $ref: "#/components/responses/TooManyRequests"
  /accounts/{account_id}/friends/{friend_id}:
    put:
      tags:
        - Friends
      summary: Add a friend to this account
      parameters:
        - $ref: "#/components/parameters/AccountID"
        - $ref: "#/components/parameters/FriendID"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateFriendRequest"
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/FriendResponse"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"
        "422":
          $ref: "#/components/responses/UnprocessableEntity"
        "429":
          $ref: "#/components/responses/TooManyRequests"
    delete:
      tags:
        - Friends
      summary: Remove a friend from this account
      parameters:
        - $ref: "#/components/parameters/AccountID"
        - $ref: "#/components/parameters/FriendID"
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/FriendResponse"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"
        "422":
          $ref: "#/components/responses/UnprocessableEntity"
        "429":
          $ref: "#/components/responses/TooManyRequests"

  /status:
    get:
      tags:
        - Status
      summary: API status check
      operationId: getStatus
      security: [] # disable security
      responses:
        "200":
          description: Endpoint for users to check whether they can reach the api.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string

components:
  parameters:
    IdempotencyKey:
      in: header
      name: Idempotency-Key
      description: A idempotency key to make retrying operations safe.
      schema:
        type: string
      examples:
        IdempotencyKeyExample:
          value: my-random-key-848x8e8r1
          summary: A sample idempotency key
    Cursor:
      in: query
      name: cursor
      nullable: true
      description:
        The cursor for pagination, which can be populated by the `next_cursor`
        value of the initial request.
      schema:
        type: string
    Limit:
      in: query
      name: limit
      nullable: true
      description:
        The number of elements to fetch in the page. Defaults to 20 if not
        provided.
      schema:
        type: integer
    AccountID:
      in: path
      name: account_id
      required: true
      description: Globally unique identifier for account.
      schema:
        type: string
        format: uuid
      examples:
        AccountIDExample:
          value: d86a0a4d-7459-471a-83b4-431136320828
          summary: A sample account id
    FriendID:
      in: path
      name: friend_id
      required: true
      description: Globally unique identifier for friend.
      schema:
        type: string
        format: uuid
      examples:
        FriendIDExample:
          value: d86a0a4d-7459-471a-83b4-431136320828
          summary: A sample friend id

  schemas:
    PaginationResponse:
      type: object
      properties:
        has_more:
          type: boolean
        next_cursor:
          type: string
          nullable: true
      required:
        - has_more
        - next_cursor
    Address:
      type: object
      properties:
        address1:
          type: string
          description: Valid address.
          example: 155 Water St
        address2:
          type: string
          description: Unit or apartment number (if applicable).
        city:
          type: string
          description: Name of city.
          example: New York City
        country:
          type: string
          description: >
            Valid country code, entered in uppercase ISO 3166-1 alpha-3
            three-character format.
          example: USA
        postal_code:
          type: string
          description: >
            Valid postal code. Only USA ZIP codes are currently supported,
            entered as a five-digit ZIP or nine-digit ZIP+4.
          example: "11217"
        state:
          type: string
          description: >
            Valid state code. Only USA state codes are currently supported,
            entered in uppercase ISO 3166-2 two-character format.
          example: NY
      required:
        - address1
        - city
        - country
        - postal_code
        - state
    Account:
      type: object
      properties:
        id:
          type: string
          format: uuid
          readOnly: true
        name:
          type: string
        plan:
          type: string
          enum:
            - FREE
            - PREMIUM
          description: The plan that the user is on.
        state:
          type: string
          enum:
            - ACTIVE
            - PAUSED
          description: Account states.
        address:
          $ref: "#/components/schemas/Address"
      required:
        - name
    AccountConfiguration:
      type: object
    AccountLink:
      oneOf:
        - type: object
          title: "Google"
          properties:
            type:
              const: "google"
            google_account_id:
              type: "string"
          required:
            - type
            - google_account_id
        - type: object
          title: "Facebook"
          properties:
            type:
              const: "facebook"
            facebook_account_id:
              type: "string"
          required:
            - type
            - facebook_account_id
      discriminator:
        propertyName: type
    Error:
      type: object
      properties:
        message:
          type: string
        data: {}
    CreateFriendRequest:
      type: object
      properties:
        message:
          type: string
          writeOnly: true
    FriendResponse:
      type: object
      properties:
        mutuals:
          type: integer
          readOnly: true
        friend_since:
          type: string
          format: date-time
          readOnly: true
      required:
        - mutuals
        - friend_since

  securitySchemes:
    BasicAuth:
      type: http
      scheme: basic
    ApiKeyAuth:
      type: apiKey
      in: header
      name: "X-Acme-Api-Key"

  responses:
    BadRequest:
      description:
        A parameter in the query given in the request does not match the valid
        queries for the endpoint.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Conflict:
      description:
        The request could not be completed due to a conflict with the current
        state of the target resource.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    InternalServerError:
      description: There was a processing error on the server-side.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    NotFound:
      description: The specified resource was not found.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    TooManyRequests:
      description: |
        Client has exceeded the number of allowed requests in a given time period.

        |   |   |
        |---|---|
        | Rate limited, too many requests per second | User has exceeded their per second rate limit |
        | Rate limited, reached daily limit | User has exceeded their daily rate limit |
        | Rate limited, too many keys tried | One IP has queried too many different API keys |
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Forbidden:
      description: Client is not authorized to call the endpoint
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Unauthorized:
      description: User has not been authenticated. Invalid or missing API key.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    UnprocessableEntity:
      description: Unprocessable entity.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"

# This defines which securitySchemes can be used in conjunction with each other.
# See components.securitySchemes for their definition.
security:
  - BasicAuth: []
  - ApiKeyAuth: []
  - {} # Indicates that no-auth is a valid option.
```

</details>

<details>

<summary>Example Stainless config</summary>

```yaml
# yaml-language-server: $schema=https://app.stainless.com/config.schema.json

# 'organization' defines metadata such as the name of your organization, the
# docs site, contact information, which all get rendered on the SDK README.md.
organization:
  name: acme
  docs: https://docs.acme.com
  contact: support@acme.com

settings:
  license: Apache-2.0

# 'resources' define the high level mapping of endpoints to the structure in
# each SDK. For example, the configuration below will correspond to being
# able to call
#
#   - client.status() which makes a request to GET /status
#
#   - client.accounts.friends.list() which makes a request to GET /accounts/{account_id}/friends
#
# As well as being able to access types with
#
#   import Acme from 'acme-typescript'
#
#   const result: Acme.Account = …
#
# https://www.stainless.com/docs/guides/configure#resources
resources:
  $client:
    methods:
      status: get /status
  accounts:
    models:
      account: "#/components/schemas/Account"
      account_configuration: "#/components/schemas/AccountConfiguration"
      account_link: "#/components/schemas/AccountLink"
    methods:
      list: get /accounts
      create: post /accounts
      retrieve: get /accounts/{account_id}
      update: put /accounts/{account_id}
      link:
        endpoint: post /accounts/{account_id}/link
        skip:
          - ruby
    subresources:
      friends:
        models:
          friend: "#/components/schemas/FriendResponse"
        methods:
          list: get /accounts/{account_id}/friends
          update: put /accounts/{account_id}/friends/{friend_id}
          delete: delete /accounts/{account_id}/friends/{friend_id}

# 'pagination' configures how your pagination style works, what request params
# and response fields map to which pagination roles, and how we match your
# endpoints against the pagination style.
#
# https://www.stainless.com/docs/guides/configure#pagination
pagination:
  - name: cursor_page
    type: cursor
    request:
      cursor:
        type: string
      limit:
        type: integer
    response:
      data:
        type: array
        items: {}
      next_cursor:
        type: string
        nullable: true

# 'client_settings' primarily configures the general behavior of the api client,
# such as retries, timeouts, headers, and idempotency keys.
#
# 'client_settings.opts' defines extra arguments to add to your client,
# most prominently options that pertain to authentication, but could also be wired
# up to read from the environment and send a value as a header.
#
# https://www.stainless.com/docs/guides/configure#client-opts
client_settings:
  idempotency:
    header: "Idempotency-Key"

  opts:
    username:
      type: string
      nullable: true
      auth:
        security_scheme: BasicAuth
        role: username
      read_env: ACME_USERNAME
    password:
      type: string
      nullable: true
      auth:
        security_scheme: BasicAuth
        role: password
      read_env: ACME_PASSWORD
    acme_api_key:
      type: string
      nullable: true
      auth:
        security_scheme: ApiKeyAuth
      read_env: ACME_API_KEY

# 'environments' map names of an environment to the corresponding base url.
environments:
  production: https://api.acme.com/v1
  sandbox: https://sandbox.acme.com/v1

# 'query_settings' define how more complex query parameters (such as objects and arrays)
# are rendered.
query_settings:
  nested_format: brackets
  array_format: repeat

# 'readme' defines what endpoints and arguments we should use to generate the snippets
# in the README of each language.
readme:
  example_requests:
    # The default example request is used for all snippets unless they are specifically overrode.
    default:
      type: request
      endpoint: post /accounts
      params: {}
    # You can explicitly override each example from the default case, such as 'headline'
    # which is the first snippet your user sees in the README. The 'default' example request
    # will still be used for all other example snippets.
    headline:
      type: request
      endpoint: post /accounts
      params: {}
    pagination:
      type: request
      endpoint: get /accounts
      params: {}
targets:
  typescript:
    package_name: acme-typescript
    production_repo: stainless-sdks/acme-typescript-public
    publish:
      npm: true
  python:
    package_name: acme
    project_name: acme-python
    production_repo: stainless-sdks/acme-python-public
    publish:
      pypi: true
  go:
    package_name: acme-go
    production_repo: stainless-sdks/acme-go-public
  ruby:
    gem_name: acme
    production_repo: stainless-sdks/acme-ruby-public
    publish:
      rubygems: false
```

</details>

<style>
table {
  width: 100%;
}

table th:first-child {
  min-width: 230px;
}

@media (prefers-color-scheme: dark) {
  table tr:nth-child(even) {
    background-color: var(--sl-color-bg-table-row);
  }

  table tr:nth-child(1) {
    background-color: unset
  }
}

pre {
  border: none !important;
  background-color: var(--sl-color-bg-inline-code);
  border-radius: 6px;
}

code {
  border-radius: 6px;
}

code[class*="language-"] {
  white-space: pre;
  display: block;
  overflow-x: auto;
  background-color: var(--sl-color-bg-inline-code);
  margin-block: -0.125rem;
  padding: 0.125rem 0.375rem;
  font-size: var(--sl-text-code-sm);
}
</style>

## Config

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>organization</code></td><td><code><span><a href="#organization">Organization</a></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>targets?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  node?: <a href="#node">Node</a>,<br/>  typescript?: <a href="#type-script">TypeScript</a>,<br/>  python?: <a href="#python">Python</a>,<br/>  java?: <a href="#java">Java</a>,<br/>  kotlin?: <a href="#kotlin">Kotlin</a>,<br/>  go?: <a href="#go">Go</a>,<br/>  ruby?: <a href="#ruby">Ruby</a>,<br/>  terraform?: <a href="#terraform">Terraform</a>,<br/>&#125;</span></code> <span><p>Customization for each language&#39;s repo name, package manager name, etc.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>environments</code></td><td><code><span>Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span>&gt;</span></code> <span><p>Map of the name of the environment which appears in the SDK to the corresponding url to use.
    The first environment in the map will be used as the default environment.</p>
    <pre><code class="language-yaml">environments:
      production: https://example.com/api
      sandbox: https://sandbox.example.com/api
    </code></pre>
    </span></td>
  </tr>
  <tr>
    <td><code>resources</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  [x: string]: <a href="#resource">Resource</a>,<br/>  <span style="color: gray">// Used to declare any models that should be shared <br/>  // across resources. Defining methods in this <br/>  // resource is not supported. <br/>  </span>$shared?: <a href="#resource">Resource</a>,<br/>  <span style="color: gray">// Used to define methods and resources at the <br/>  // client level, e.g. for an API status endpoint <br/>  </span>$client?: <a href="#resource">Resource</a>,<br/>&#125;</span></code> <span><p>Resources define the organization for your API and the endpoints that are available under which resources.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>readme</code></td><td><code><span><a href="#readme">Readme</a></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>settings</code></td><td><code><span><a href="#settings">Settings</a></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>query_settings</code></td><td><code><span><a href="#query-settings">QuerySettings</a></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>security?</code></td><td><code><span>Array&lt;<a href="#security-config">SecurityConfig</a>&gt;</span></code> <span><p>Overrides the top-level security key in the OpenAPI spec.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>security_schemes?</code></td><td><code><span>Record&lt;<span style="color: var(--green)">string</span>, <a href="#security-scheme">SecurityScheme</a>&gt;</span></code> <span><p>Overrides the <code>components.securitySchemes</code> in the OpenAPI spec.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>client_settings?</code></td><td><code><span><a href="#client-settings">ClientSettings</a></span></code> <span><p>Settings for customizing the <a href="https://www.stainless.com/docs/guides/configure#client">Client class</a> in the SDKs.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>pagination?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  description?: <span style="color: var(--green)">string</span>,<br/>  type: <span style="color: var(--green)">"cursor"</span> | <span style="color: var(--green)">"cursor_id"</span> | <span style="color: var(--green)">"cursor_url"</span> | <span style="color: var(--green)">"fake_page"</span> | <span style="color: var(--green)">"offset"</span> | <span style="color: var(--green)">"page_number"</span>,<br/>  request: Record&lt;<span style="color: var(--green)">string</span>, unknown&gt;,<br/>  response: Record&lt;<span style="color: var(--green)">string</span>, unknown&gt;,<br/>  param_location?: <span style="color: var(--green)">"query"</span> | <span style="color: var(--green)">"body"</span>,<br/>&#125; | Array&lt;<a href="#pagination-scheme">PaginationScheme</a>&gt;</span></code> <span><p>Defines pagination schemes for pagination helpers and auto-pagination in the SDKs.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>unspecified_endpoints?</code></td><td><code><span>Array&lt;<span style="color: var(--green)">string</span>&gt;</span></code> <span><p>List of endpoints to explicitly ignore, such as <code>[&quot;post /internal_endpoint&quot;, &quot;get /redundant_endpoint&quot;]</code></p>
    </span></td>
  </tr>
  <tr>
    <td><code>errors?</code></td><td><code><span><a href="#errors-config">ErrorsConfig</a></span></code> <span><p>Defines custom error types in the SDKs.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>codeflow?</code></td><td><code><span><a href="#codeflow-config">CodeflowConfig</a></span></code> <span><p>Configures various codeflow (automated releases to package managers) options.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>custom_casings?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">Record&lt;<span style="color: var(--green)">string</span>, <a href="#initialism-config">InitialismConfig</a> | <a href="#casing-config">CasingConfig</a> | &#123;<br/>  singular: <a href="#casing-config">CasingConfig</a>,<br/>  plural: <a href="#casing-config">CasingConfig</a>,<br/>&#125;&gt;</span></code> <span><p>Defines how phrases are rendered in different SDKs. Can be either an &#39;initialism&#39; which tells the generator to treat the word as an abbreviation like &#39;API&#39; or &#39;CPU&#39;, or a more powerful <code>CasingConfig</code> which can specify how that word is represented in the different casing formats. In rare cases where customization of pluralization is required, you can also specify singular/plural versions of the word.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>openapi?</code></td><td><code><span><a href="#open-api-config">OpenAPIConfig</a></span></code> <span><p>Describes changes to the input OpenAPI spec and also whether or not to add code samples to the output OpenAPI spec.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>diagnostics?</code></td><td><code><span><a href="#diagnostics-config">DiagnosticsConfig</a></span></code> <span><p>Configures diagnostics that appear in builds and the Studio.</p>
    </span></td>
  </tr>
</table>

## Organization - `organization` {#organization}

<p>How the organization is represented in the SDKs, such as `name` and `github_org`.</p>
<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>name</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Name of your organization or company, in lowercase. Used in documentation.
    The generated client name defaults to this. To customize the capitalization,
    use <code>custom_casings</code>.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>docs?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Link to your API documentation.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>contact?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Contact email for bug reports, questions, and support requests.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>security_contact?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Security email address for reporting vulnerabilities. Will be mentioned in the generated
    SECURITY.md. Defaults to the contact email.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>security_policy_url?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Link to a page covering your security policy. Will be mentioned in the generated SECURITY.md.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>security_policy_terms?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Terms for your security policy. Will be added to the generated SECURITY.md.</p>
    <p>Stainless always generates a default security policy covering SDKs security issues.
    This field is for additional terms you want to add and will be included in a section
    &#39;<Your org name> Terms and Policies&#39;.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>github_org?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Name of the GitHub organization that the production SDKs live in.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>upload_spec?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Whether or not to enable uploading the input openapi spec and publicly exposing it in the SDK.</p>
    <p>This allows running tests in the SDKs against a mock server, and if disabled will disable tests from automatically running in CI.</p>
    </span></td>
  </tr>
</table>

## Targets - `targets`

### TypeScript - `targets.typescript` {#type-script}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>readme_title?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Title for this package, typically used to display the README header in the format <code>&lt;Title&gt; API Library</code> (for example, &quot;Your company language library&quot;)&#39;</p>
    </span></td>
  </tr>
  <tr>
    <td><code>production_repo?</code></td><td><code><span><span style="color: var(--green)">string</span> | null</span></code> <span><p>The production repo that this target is linked to. For example, <code>AcmeOrg/acme-typescript</code>.</p>
    <p>You can optionally add a branch target, such as <code>AcmeOrg/acme-typescript#master</code>. By default, the target branch is <code>main</code>.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>screencast?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>URL of a screencast to showcase on the project README. Must be an .mp4, .webm, or .mov file less &lt;10MB.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Skip generation for this target</p>
    </span></td>
  </tr>
  <tr>
    <td><code>package_name</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The name of the package in the import such as <code>import … from &quot;&lt;package_name&gt;&quot;</code> and the name in package.json.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>publish</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  npm: <span style="color: purple">boolean</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>options?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Enable MCP server generation. <br/>  //  <br/>  // If enabled, will create a sub-directory in the <br/>  // SDK under `packages/mcp-server`. <br/>  // For more information: <br/>  // https://modelcontextprotocol.io/introduction <br/>  //  <br/>  // If set to true, it will generate an MCP tool for <br/>  // every endpoint. If set to an object, you can <br/>  // customize <br/>  // the package name and whether resources are <br/>  // enabled by default. <br/>  </span>mcp_server?: <span style="color: purple">boolean</span> | &#123;<br/>    <span style="color: gray">// The name of the mcp package. Defaults to <br/>    // &quot;&lt;typescript-package&gt;-mcp&quot; <br/>    </span>package_name?: <span style="color: var(--green)">string</span>,<br/>    <span style="color: gray">// Adds all endpoints to the MCP server by default. <br/>    // Defaults to true. <br/>    //  <br/>    // Set this value to false to opt-in each resource <br/>    // or endpoint to be included. <br/>    //  <br/>    // e.g. <br/>    // resources: <br/>    //   my_resource: <br/>    //     mcp: true <br/>    //     methods: ... # all methods enabled <br/>    //   another_resource: <br/>    //     methods: <br/>    //       create: <br/>    //         endpoint: /v1/create <br/>    //         mcp: true # just this endpoint is enabled <br/>    </span>enable_all_resources?: <span style="color: purple">boolean</span>,<br/>    <span style="color: gray">// &quot;Dynamic tools&quot; are a feature of the MCP server <br/>    // that provides tools for LLMs to dynamically <br/>    // discover <br/>    // and invoke endpoints, rather than generating a <br/>    // tool for each endpoint. <br/>    //  <br/>    // This is helpful if an API has a large number of <br/>    // endpoints, such that the default list of tools <br/>    // would <br/>    // be too long to display or not fit into LLM <br/>    // context windows. It can also be helpful if the <br/>    // user is unlikely <br/>    // to know in advance which tools they want to <br/>    // enable explicitly. <br/>    //  <br/>    // If true, the MCP server will recommend these <br/>    // dynamic tools in the README, and enable them by <br/>    // default if no <br/>    // arguments are provided. If false, importing all <br/>    // tools will be recommended in the README. If <br/>    // unset, then we&apos;ll <br/>    // recommend dynamic tools if the number of <br/>    // endpoints is greater than 20, but never enable it <br/>    // by default. <br/>    //  <br/>    // In any case, dynamic tools can be enabled or <br/>    // disabled explicitly by the end user. <br/>    </span>recommend_dynamic_tools?: <span style="color: purple">boolean</span>,<br/>    <span style="color: gray">// Generates a cloudflare worker that you can deploy <br/>    // as a Remote MCP Server in your own <br/>    // Cloudflare account. This is useful if you want to <br/>    // easily set up an MCP server that handles <br/>    // OAuth for use in web clients like claude.ai. <br/>    //  <br/>    // See <br/>    // generate-an-mcp-server#deploy-a-remote-mcp-server <br/>    // for more information. <br/>    </span>generate_cloudflare_worker?: <span style="color: purple">boolean</span>,<br/>    publish?: &#123;<br/>      <span style="color: gray">// Docker image publishing configuration. Set to <br/>      // false to disable, string for image name, or <br/>      // object for full config. <br/>      </span>docker?: false | <span style="color: var(--green)">string</span> | &#123;<br/>        <span style="color: gray">// The Docker image name, e.g. &quot;myorg/my-api-mcp&quot; <br/>        </span>image_name: <span style="color: var(--green)">string</span>,<br/>        <span style="color: gray">// The Docker registry to publish to <br/>        </span>registry?: <span style="color: var(--green)">string</span>,<br/>      &#125;,<br/>    &#125;,<br/>  &#125;,<br/>  browser?: &#123;<br/>    <span style="color: gray">// If set to `dangerous_allow` then the SDK will <br/>    // only be usable in the browser when passing an <br/>    // explicit flag. <br/>    </span>state?: <span style="color: var(--green)">"allow"</span> | <span style="color: var(--green)">"disallow"</span> | <span style="color: var(--green)">"dangerous_allow"</span>,<br/>    <span style="color: gray">// The error message to throw. <br/>    </span>message?: <span style="color: var(--green)">string</span>,<br/>  &#125;,<br/>  <span style="color: gray">// If you&apos;re migrating from a `node` target to <br/>  // `typescript` you can specify 2 version strings <br/>  // that will be used in the migration guides and <br/>  // scripts. <br/>  //  <br/>  // The versions will be used verbatim, such as in <br/>  // &quot;Run migrations from your-sdk v{previous_version} <br/>  // to v{migrated_version}&quot;. <br/>  //  <br/>  // If your SDK is post-1.0, we recommend to only <br/>  // include the major version, such as <br/>  // `previous_version: &quot;2&quot;, migrated_version: &quot;3&quot;`. <br/>  </span>node_migration?: &#123;<br/>    previous_version: <span style="color: var(--green)">string</span>,<br/>    migrated_version: <span style="color: var(--green)">string</span>,<br/>  &#125;,<br/>&#125;</span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>custom?</code></td><td><code><span>&#123;  &#125;</span></code> <span></span></td>
  </tr>
</table>

<details><summary>

### Node - `targets.node` (deprecated) {#node}

</summary>

:::warning
The `node` target is deprecated in favor of the `typescript` target. See the [changelog entry](https://www.stainless.com/changelog/typescript-sdk-generator-v2) and the [migration guide](../guides/migrate-to-typescript) for more information.
:::

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>readme_title?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Title for this package, typically used to display the README header in the format <code>&lt;Title&gt; API Library</code> (for example, &quot;Your company language library&quot;)&#39;</p>
    </span></td>
  </tr>
  <tr>
    <td><code>production_repo?</code></td><td><code><span><span style="color: var(--green)">string</span> | null</span></code> <span><p>The production repo that this target is linked to. For example, <code>AcmeOrg/acme-typescript</code>.</p>
    <p>You can optionally add a branch target, such as <code>AcmeOrg/acme-typescript#master</code>. By default, the target branch is <code>main</code>.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>screencast?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>URL of a screencast to showcase on the project README. Must be an .mp4, .webm, or .mov file less &lt;10MB.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Skip generation for this target</p>
    </span></td>
  </tr>
  <tr>
    <td><code>package_name</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The name of the package in the import such as <code>import … from &quot;&lt;package_name&gt;&quot;</code> and the name in package.json.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>publish</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  npm: <span style="color: purple">boolean</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>options?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Enable MCP server generation. <br/>  //  <br/>  // If enabled, will create a sub-directory in the <br/>  // SDK under `packages/mcp-server`. <br/>  // For more information: <br/>  // https://modelcontextprotocol.io/introduction <br/>  //  <br/>  // If set to true, it will generate an MCP tool for <br/>  // every endpoint. If set to an object, you can <br/>  // customize <br/>  // the package name and whether resources are <br/>  // enabled by default. <br/>  </span>mcp_server?: <span style="color: purple">boolean</span> | &#123;<br/>    <span style="color: gray">// The name of the mcp package. Defaults to <br/>    // &quot;&lt;typescript-package&gt;-mcp&quot; <br/>    </span>package_name?: <span style="color: var(--green)">string</span>,<br/>    <span style="color: gray">// Adds all endpoints to the MCP server by default. <br/>    // Defaults to true. <br/>    //  <br/>    // Set this value to false to opt-in each resource <br/>    // or endpoint to be included. <br/>    //  <br/>    // e.g. <br/>    // resources: <br/>    //   my_resource: <br/>    //     mcp: true <br/>    //     methods: ... # all methods enabled <br/>    //   another_resource: <br/>    //     methods: <br/>    //       create: <br/>    //         endpoint: /v1/create <br/>    //         mcp: true # just this endpoint is enabled <br/>    </span>enable_all_resources?: <span style="color: purple">boolean</span>,<br/>    <span style="color: gray">// &quot;Dynamic tools&quot; are a feature of the MCP server <br/>    // that provides tools for LLMs to dynamically <br/>    // discover <br/>    // and invoke endpoints, rather than generating a <br/>    // tool for each endpoint. <br/>    //  <br/>    // This is helpful if an API has a large number of <br/>    // endpoints, such that the default list of tools <br/>    // would <br/>    // be too long to display or not fit into LLM <br/>    // context windows. It can also be helpful if the <br/>    // user is unlikely <br/>    // to know in advance which tools they want to <br/>    // enable explicitly. <br/>    //  <br/>    // If true, the MCP server will recommend these <br/>    // dynamic tools in the README, and enable them by <br/>    // default if no <br/>    // arguments are provided. If false, importing all <br/>    // tools will be recommended in the README. If <br/>    // unset, then we&apos;ll <br/>    // recommend dynamic tools if the number of <br/>    // endpoints is greater than 20, but never enable it <br/>    // by default. <br/>    //  <br/>    // In any case, dynamic tools can be enabled or <br/>    // disabled explicitly by the end user. <br/>    </span>recommend_dynamic_tools?: <span style="color: purple">boolean</span>,<br/>    <span style="color: gray">// Generates a cloudflare worker that you can deploy <br/>    // as a Remote MCP Server in your own <br/>    // Cloudflare account. This is useful if you want to <br/>    // easily set up an MCP server that handles <br/>    // OAuth for use in web clients like claude.ai. <br/>    //  <br/>    // See <br/>    // generate-an-mcp-server#deploy-a-remote-mcp-server <br/>    // for more information. <br/>    </span>generate_cloudflare_worker?: <span style="color: purple">boolean</span>,<br/>    publish?: &#123;<br/>      <span style="color: gray">// Docker image publishing configuration. Set to <br/>      // false to disable, string for image name, or <br/>      // object for full config. <br/>      </span>docker?: false | <span style="color: var(--green)">string</span> | &#123;<br/>        <span style="color: gray">// The Docker image name, e.g. &quot;myorg/my-api-mcp&quot; <br/>        </span>image_name: <span style="color: var(--green)">string</span>,<br/>        <span style="color: gray">// The Docker registry to publish to <br/>        </span>registry?: <span style="color: var(--green)">string</span>,<br/>      &#125;,<br/>    &#125;,<br/>  &#125;,<br/>  browser?: &#123;<br/>    <span style="color: gray">// If set to `dangerous_allow` then the SDK will <br/>    // only be usable in the browser when passing an <br/>    // explicit flag. <br/>    </span>state?: <span style="color: var(--green)">"allow"</span> | <span style="color: var(--green)">"disallow"</span> | <span style="color: var(--green)">"dangerous_allow"</span>,<br/>    <span style="color: gray">// The error message to throw. <br/>    </span>message?: <span style="color: var(--green)">string</span>,<br/>  &#125;,<br/>&#125;</span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>custom?</code></td><td><code><span>&#123;  &#125;</span></code> <span></span></td>
  </tr>
</table>

</details>

### Python - `targets.python` {#python}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>readme_title?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Title for this package, typically used to display the README header in the format <code>&lt;Title&gt; API Library</code> (for example, &quot;Your company language library&quot;)&#39;</p>
    </span></td>
  </tr>
  <tr>
    <td><code>production_repo?</code></td><td><code><span><span style="color: var(--green)">string</span> | null</span></code> <span><p>The production repo that this target is linked to. For example, <code>AcmeOrg/acme-typescript</code>.</p>
    <p>You can optionally add a branch target, such as <code>AcmeOrg/acme-typescript#master</code>. By default, the target branch is <code>main</code>.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>screencast?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>URL of a screencast to showcase on the project README. Must be an .mp4, .webm, or .mov file less &lt;10MB.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Skip generation for this target</p>
    </span></td>
  </tr>
  <tr>
    <td><code>package_name</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The name of the import, e.g. <code>from &lt;package_name&gt; import …</code></p>
    </span></td>
  </tr>
  <tr>
    <td><code>project_name?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The Python project name, e.g. <code>pip install &lt;project_name&gt;</code></p>
    </span></td>
  </tr>
  <tr>
    <td><code>publish</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  pypi: <span style="color: purple">boolean</span> | &#123;<br/>    <span style="color: gray">// The name of the package in pypi, e.g. `pip <br/>    // install &lt;package_name&gt;` <br/>    </span>package_name?: <span style="color: var(--green)">string</span>,<br/>  &#125;,<br/>&#125;</span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>options?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Change the name of the dependency group for <br/>  // websocket support, e.g. `pip install <br/>  // apiclient[websocket]` to `pip install <br/>  // apiclient[my_websocket_api]`. <br/>  </span>websockets_extra_name?: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// Disable warnings for fields that start with <br/>  // `model_` <br/>  </span>disable_pydantic_namespace_protection?: <span style="color: purple">boolean</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
</table>

### Go - `targets.go` {#go}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>readme_title?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Title for this package, typically used to display the README header in the format <code>&lt;Title&gt; API Library</code> (for example, &quot;Your company language library&quot;)&#39;</p>
    </span></td>
  </tr>
  <tr>
    <td><code>production_repo?</code></td><td><code><span><span style="color: var(--green)">string</span> | null</span></code> <span><p>The production repo that this target is linked to. For example, <code>AcmeOrg/acme-typescript</code>.</p>
    <p>You can optionally add a branch target, such as <code>AcmeOrg/acme-typescript#master</code>. By default, the target branch is <code>main</code>.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>screencast?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>URL of a screencast to showcase on the project README. Must be an .mp4, .webm, or .mov file less &lt;10MB.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Skip generation for this target</p>
    </span></td>
  </tr>
  <tr>
    <td><code>package_name</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The name of the root package, containing the top-level client, options, and methods.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>options?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Override the name used for the internal `option` <br/>  // package <br/>  </span>option_package_name?: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// Overrides the name used for the API client <br/>  // struct. This name should be pascal cased and a <br/>  // valid public Go identifier. By default, this is <br/>  // `Client`, and the constructor will be called <br/>  // `NewClient`. <br/>  //  <br/>  // Overriding it to e.g. `APIClient` will change the <br/>  // struct to be `APIClient`, and the corresponding <br/>  // constructor will be called `NewAPIClient`. <br/>  </span>client_name?: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// Enable the V2 Go SDK generator with &quot;true&quot; or <br/>  // &quot;migration&quot;. **Caution:** the V2 SDK is not <br/>  // backwards compatible with V1. <br/>  //  <br/>  // Defaults to &apos;false&apos; if not specified. <br/>  //  <br/>  // If set to &apos;migration&apos; it will also generate a <br/>  // migration guide. <br/>  </span>enable_v2?: <span style="color: purple">boolean</span> | <span style="color: var(--green)">"migration"</span>,<br/>  <span style="color: gray">// Doesn&apos;t suffix union types with &apos;-Union&apos;, and <br/>  // removes the &apos;Of-&apos; prefix from union variant <br/>  // names. This option is **not recommended** for <br/>  // large (or soon-to-be large) APIs, as it comes <br/>  // with visual clarity and forwards compatibility <br/>  // costs. <br/>  </span>subtle_union_naming?: <span style="color: purple">boolean</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
</table>

### Java - `targets.java` {#java}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>readme_title?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Title for this package, typically used to display the README header in the format <code>&lt;Title&gt; API Library</code> (for example, &quot;Your company language library&quot;)&#39;</p>
    </span></td>
  </tr>
  <tr>
    <td><code>production_repo?</code></td><td><code><span><span style="color: var(--green)">string</span> | null</span></code> <span><p>The production repo that this target is linked to. For example, <code>AcmeOrg/acme-typescript</code>.</p>
    <p>You can optionally add a branch target, such as <code>AcmeOrg/acme-typescript#master</code>. By default, the target branch is <code>main</code>.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>screencast?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>URL of a screencast to showcase on the project README. Must be an .mp4, .webm, or .mov file less &lt;10MB.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Skip generation for this target</p>
    </span></td>
  </tr>
  <tr>
    <td><code>reverse_domain</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The reverse domain to generate the SDK under, e.g. if <code>reverse_domain</code> is &quot;com.example.api&quot;, then you would import the client as <code>import com.example.api.client.okhttp.ExampleOkHttpClient</code></p>
    </span></td>
  </tr>
  <tr>
    <td><code>publish</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  maven: <span style="color: purple">boolean</span> | &#123;<br/>    <span style="color: gray">// The maven groupId to publish this artifact to, <br/>    // e.g. `com.example.api`. By default, uses the <br/>    // value of reverse_domain. <br/>    </span>group_id?: <span style="color: var(--green)">string</span>,<br/>    <span style="color: gray">// The maven artifactId to publish this artifact as, <br/>    // defaults to `&lt;organization.name&gt;-java`, e.g. <br/>    // `example-java` <br/>    </span>artifact_id?: <span style="color: var(--green)">string</span>,<br/>    <span style="color: gray">// Customers who do not already have a Sonatype <br/>    // OSSRH account should use the newer &quot;portal&quot; <br/>    // option. <br/>    </span>sonatype_platform?: <span style="color: var(--green)">"portal"</span> | <span style="color: var(--green)">"ossrh"</span>,<br/>    sonatype_host?: <span style="color: var(--green)">string</span>,<br/>  &#125;,<br/>  <span style="color: gray">// Whether to generate and include HTML docs in the <br/>  // published JAR. <br/>  </span>docs?: <span style="color: purple">boolean</span>,<br/>&#125;</span></code> <span><p>See <a href="/docs/guides/publish#java--kotlin-sonatype-maven-central">our publishing guide</a> for more information on how to publish your SDK.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>options?</code></td><td><code><span>&#123;  &#125;</span></code> <span></span></td>
  </tr>
</table>

### Kotlin - `targets.kotlin` {#kotlin}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>readme_title?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Title for this package, typically used to display the README header in the format <code>&lt;Title&gt; API Library</code> (for example, &quot;Your company language library&quot;)&#39;</p>
    </span></td>
  </tr>
  <tr>
    <td><code>production_repo?</code></td><td><code><span><span style="color: var(--green)">string</span> | null</span></code> <span><p>The production repo that this target is linked to. For example, <code>AcmeOrg/acme-typescript</code>.</p>
    <p>You can optionally add a branch target, such as <code>AcmeOrg/acme-typescript#master</code>. By default, the target branch is <code>main</code>.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>screencast?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>URL of a screencast to showcase on the project README. Must be an .mp4, .webm, or .mov file less &lt;10MB.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Skip generation for this target</p>
    </span></td>
  </tr>
  <tr>
    <td><code>reverse_domain</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The reverse domain to generate the SDK under, e.g. if <code>reverse_domain</code> is &quot;com.example.api&quot;, then you would import the client as <code>import com.example.api.client.okhttp.ExampleOkHttpClient</code></p>
    </span></td>
  </tr>
  <tr>
    <td><code>publish</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  maven: <span style="color: purple">boolean</span> | &#123;<br/>    <span style="color: gray">// The maven groupId to publish this artifact to, <br/>    // e.g. `com.example.api`. By default, uses the <br/>    // value of reverse_domain. <br/>    </span>group_id?: <span style="color: var(--green)">string</span>,<br/>    <span style="color: gray">// The maven artifactId to publish this artifact as, <br/>    // defaults to `&lt;organization.name&gt;-java`, e.g. <br/>    // `example-java` <br/>    </span>artifact_id?: <span style="color: var(--green)">string</span>,<br/>    <span style="color: gray">// Customers who do not already have a Sonatype <br/>    // OSSRH account should use the newer &quot;portal&quot; <br/>    // option. <br/>    </span>sonatype_platform?: <span style="color: var(--green)">"portal"</span> | <span style="color: var(--green)">"ossrh"</span>,<br/>    sonatype_host?: <span style="color: var(--green)">string</span>,<br/>  &#125;,<br/>  <span style="color: gray">// Whether to generate and include HTML docs in the <br/>  // published JAR. <br/>  </span>docs?: <span style="color: purple">boolean</span>,<br/>&#125;</span></code> <span><p>See <a href="/docs/guides/publish#java--kotlin-sonatype-maven-central">our publishing guide</a> for more information on how to publish your SDK.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>options?</code></td><td><code><span>&#123;  &#125;</span></code> <span></span></td>
  </tr>
</table>

### Ruby - `targets.ruby` {#ruby}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>readme_title?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Title for this package, typically used to display the README header in the format <code>&lt;Title&gt; API Library</code> (for example, &quot;Your company language library&quot;)&#39;</p>
    </span></td>
  </tr>
  <tr>
    <td><code>production_repo?</code></td><td><code><span><span style="color: var(--green)">string</span> | null</span></code> <span><p>The production repo that this target is linked to. For example, <code>AcmeOrg/acme-typescript</code>.</p>
    <p>You can optionally add a branch target, such as <code>AcmeOrg/acme-typescript#master</code>. By default, the target branch is <code>main</code>.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>screencast?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>URL of a screencast to showcase on the project README. Must be an .mp4, .webm, or .mov file less &lt;10MB.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Skip generation for this target</p>
    </span></td>
  </tr>
  <tr>
    <td><code>gem_name</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The name of the gem.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>publish</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  rubygems: <span style="color: purple">boolean</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>options?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Overrides the name used for the API client <br/>  // struct. This name should be a valid public Ruby <br/>  // identifier. By default, this is `Client`. <br/>  //  <br/>  // Overriding it to e.g. `APIClient` will change the <br/>  // class to be `APIClient`. <br/>  </span>client_name?: <span style="color: var(--green)">string</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
</table>

### Terraform - `targets.terraform` {#terraform}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>readme_title?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Title for this package, typically used to display the README header in the format <code>&lt;Title&gt; API Library</code> (for example, &quot;Your company language library&quot;)&#39;</p>
    </span></td>
  </tr>
  <tr>
    <td><code>screencast?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>URL of a screencast to showcase on the project README. Must be an .mp4, .webm, or .mov file less &lt;10MB.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Skip generation for this target</p>
    </span></td>
  </tr>
  <tr>
    <td><code>production_repo</code></td><td><code><span><span style="color: var(--green)">string</span> | null</span></code> <span><p>The production repo that publishes to the Terraform Registry.</p>
    <p>The Terraform Registry requires GitHub repos to be prefixed with &#39;terraform-provider-<providername>&#39;, e.g. &#39;Acme-Org/terraform-provider-acme&#39;.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>provider_name</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The name of the provider that users import. This is usually a single word, and is prefixed by your org name.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>publish</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Enable releasing to Hashicorp. See <br/>  // /docs/guides/publish#terraform-terraform-registry <br/>  </span>hashicorp_registry: <span style="color: purple">boolean</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>options?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Explicitly set the Go SDK package to depend on <br/>  </span>go_sdk_package?: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// Explicitly set the Go SDK version to depend on <br/>  </span>go_sdk_version?: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// Automatically infer all possible resources and <br/>  // data sources from the stainless config <br/>  </span>infer_all_services?: <span style="color: purple">boolean</span>,<br/>  <span style="color: gray">// whether to enable a timeout property for resources <br/>  </span>timeouts?: <span style="color: purple">boolean</span> | &#123;<br/>    <span style="color: gray">// Attribute name for timeout parameter <br/>    </span>name?: <span style="color: var(--green)">string</span>,<br/>  &#125;,<br/>&#125;</span></code> <span></span></td>
  </tr>
</table>

## SupportedLanguage {#supported-language}

- `node`
- `typescript`
- `python`
- `go`
- `java`
- `kotlin`
- `ruby`
- `terraform`
- `cli`
- `php`
- `csharp`
- `http`

## Resource - `resources.*` {#resource}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>custom?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Set <code>custom: true</code> to use <code>customer_code</code> content for the resource instead of generated code</p>
    </span></td>
  </tr>
  <tr>
    <td><code>models?</code></td><td><code><span>Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span> | <a href="#model">Model</a>&gt;</span></code> <span><p>Configure the models--named types--defined in the resource.</p>
    <p>Each key in the object is the name of the model and the value
    is either the name of a schema in <code>#/components/schemas</code> or an object with more detail.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>methods?</code></td><td><code><span>Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span> | <a href="#method">Method</a>&gt;</span></code> <span><p>Configure the methods defined in this resource.</p>
    <p>Each key in the object is the name of the method and the value
    is either an endpoint (for example, <code>get /foo</code>) or an object with more detail.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>description?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Add a docstring for the resource.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>terraform?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;"><span style="color: purple">boolean</span> | &#123;<br/>  <span style="color: gray">// The name of the Terraform resource (prefixed by <br/>  // your organization name) <br/>  </span>name?: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// whether to enable a timeout property <br/>  </span>timeouts?: <span style="color: purple">boolean</span> | &#123;<br/>    <span style="color: gray">// Attribute name for timeout parameter <br/>    </span>name?: <span style="color: var(--green)">string</span>,<br/>  &#125;,<br/>  <span style="color: gray">// Whether to generate Terraform resource <br/>  </span>resource?: <span style="color: purple">boolean</span>,<br/>  <span style="color: gray">// Whether to generate Terraform data sources <br/>  </span>data_source?: <span style="color: purple">boolean</span>,<br/>  <span style="color: gray">// Configures whether a warning message is shown to <br/>  // users when they attempt to delete a resource that <br/>  // does not have a delete endpoint. <br/>  //  <br/>  // - warning: Does nothing upon delete, but <br/>  // generates a warning message before the user <br/>  // attempts to create or delete the resource. <br/>  //  <br/>  // - no_warning: Does nothing upon delete, and does <br/>  // not generate a warning message. <br/>  </span>unsupported_delete_behavior?: <span style="color: var(--green)">"warning"</span> | <span style="color: var(--green)">"no_warning"</span>,<br/>  <span style="color: gray">// Skip tests and provide a reason <br/>  </span>skip_tests_reason?: <span style="color: var(--green)">string</span>,<br/>&#125;</span></code> <span><p>Terraform configuration options for this resource.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>subresources?</code></td><td><code><span>Record&lt;<span style="color: var(--green)">string</span>, <a href="#resource">Resource</a>&gt;</span></code> <span><p>Define nested namespaces for accessing models and methods.</p>
    <p>For example, with a &quot;cards&quot; resource containing a &quot;transactions&quot; subresource, the
    generated Python method invocation is <code>client.cards.transactions.retrieve()</code>.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>deprecated?</code></td><td><code><span><span style="color: var(--green)">string</span> | Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span>&gt;</span></code> <span><p>Set the deprecation message for this resource</p>
    </span></td>
  </tr>
  <tr>
    <td><code>mcp?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;"><span style="color: purple">boolean</span> | &#123;<br/>  <span style="color: gray">// A list of tags that end-users can use to filter <br/>  // which resources and endpoints to include <br/>  </span>tags?: Array&lt;<span style="color: var(--green)">string</span>&gt;,<br/>&#125;</span></code> <span><p>whether to generate MCP Server tools for this resource</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span> | Array&lt;<a href="#supported-language">SupportedLanguage</a>&gt;</span></code> <span><p>Skip SDK generation for a resource by specifying <code>skip: true</code>. Skip SDK generation for a resource per language by specifying the languages to skip (for example, <code>skip: [go, node]</code>). Skipping generation can aid in debugging code generation errors.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>only?</code></td><td><code><span>Array&lt;<a href="#supported-language">SupportedLanguage</a>&gt;</span></code> <span><p>Opposite of <code>skip</code>; if set, SDK generation is only performed for this resource.</p>
    </span></td>
  </tr>
</table>

## Method - `resources.*.methods.*` {#method}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type?</code></td><td><code><span><span style="color: var(--green)">"http"</span></span></code> <span><p>Describes a method for a standard http endpoint.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>endpoint</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>A pair of HTTP verb &amp; path, e.g. <code>get /foo</code>, <code>post /transactions/&#123;user_id&#125;</code></p>
    </span></td>
  </tr>
  <tr>
    <td><code>unwrap_response?</code></td><td><code><span><span style="color: var(--green)">string</span> | false</span></code> <span><p>Response property to be unwrapped so users don&#39;t have to access it themselves</p>
    </span></td>
  </tr>
  <tr>
    <td><code>paginated?</code></td><td><code><span><span style="color: purple">boolean</span> | <span style="color: var(--green)">string</span></span></code> <span><p>Provide <code>paginated: true</code> for methods whose responses are paginated. Or provide a string naming the page whose pagination should be matched.
    If omitted, pagination configuration is automatically determined using matching pages in the configuration.</p>
    <p>Learn more: <a href="https://www.stainless.com/docs/guides/configure#pagination">https://www.stainless.com/docs/guides/configure#pagination</a></p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip_test_reason?</code></td><td><code><span><span style="color: var(--green)">string</span> | Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span>&gt;</span></code> <span><p>Skip the generated unit test in all languages / particular languages with a given a reason</p>
    </span></td>
  </tr>
  <tr>
    <td><code>body_param_name?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Parameter name to be used for the request parameters argument. Required when the request body is not an object (for example, an array).</p>
    </span></td>
  </tr>
  <tr>
    <td><code>positional_params?</code></td><td><code><span>Array&lt;<span style="color: var(--green)">string</span>&gt;</span></code> <span><p>When specified, this overrides the default behavior (to use the <em>last</em> path parameter as a positional parameter).</p>
    <p>If a parameter is in this list, it is generated as a positional parameter in the given order.
    If a parameter is not in this list, it is generated as a structured/named parameter.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>default_request_options?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Timeout in milliseconds or ISO8601 <br/>  </span>timeout?: <span style="color: purple">number</span> | <span style="color: var(--green)">string</span> | null,<br/>  <span style="color: gray">// The default number of times to retry a failing <br/>  // request <br/>  </span>max_retries?: <span style="color: purple">number</span>,<br/>&#125;</span></code> <span><p>Configure the default request options for an individual method</p>
    </span></td>
  </tr>
  <tr>
    <td><code>docs?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Specify the response property to reference in <br/>  // example snippets. Set to &apos;false&apos; to disable <br/>  // property references, e.g. for logging the entire <br/>  // response. <br/>  </span>response_property?: false | <span style="color: var(--green)">string</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>terraform?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Define the type of method this endpoint <br/>  // represents. <br/>  // - create: handles creation of the resource. Must <br/>  // be a POST <br/>  // - read: handles reading of the resource. Must be <br/>  // a GET <br/>  // - list: handles listing of the resource. Must be <br/>  // a GET <br/>  // - update: handles updating of the resource. Must <br/>  // be a PUT or PATCH <br/>  // - delete: handles deleting the resource. Must be <br/>  // a DELETE <br/>  // - upsert: handles both updating and creating of <br/>  // the resource. Can be PUT or PATCH <br/>  // - skip: don&apos;t include this method in generation <br/>  </span>method?: <span style="color: var(--green)">"create"</span> | <span style="color: var(--green)">"read"</span> | <span style="color: var(--green)">"list"</span> | <span style="color: var(--green)">"upsert"</span> | <span style="color: var(--green)">"update"</span> | <span style="color: var(--green)">"delete"</span> | <span style="color: var(--green)">"skip"</span>,<br/>  <span style="color: gray">// Defined the name of the path param that is used <br/>  // as the ID of the resource. <br/>  </span>id_path_param?: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// Define the name of the property that represents <br/>  // the ID for the resource. It may exist as a path, <br/>  // body, or response parameter. <br/>  </span>id_property?: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// Specify how the update method on the resource <br/>  // should encode the request body. <br/>  // - put: The entire resource is replaced with the <br/>  // new resource. <br/>  // - json_merge_patch: The resource is updated as a <br/>  // JSON Merge Patch, only providing changed fields. <br/>  //  <br/>  // If null, then json_merge_patch will be used for <br/>  // PATCH endpoints, and put otherwise. <br/>  </span>update_behavior?: <span style="color: var(--green)">"put"</span> | <span style="color: var(--green)">"json_merge_patch"</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>mcp?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;"><span style="color: purple">boolean</span> | &#123;<br/>  <span style="color: gray">// A list of tags that end-users can use to filter <br/>  // which resources and endpoints to include <br/>  </span>tags?: Array&lt;<span style="color: var(--green)">string</span>&gt;,<br/>  <span style="color: gray">// Override the tool name for this endpoint <br/>  </span>tool_name?: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// Override the description for this endpoint <br/>  </span>description?: <span style="color: var(--green)">string</span>,<br/>&#125;</span></code> <span><p>whether to generate MCP Server tools for this endpoint</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span> | Array&lt;<span style="color: var(--green)">"node"</span> | <span style="color: var(--green)">"typescript"</span> | <span style="color: var(--green)">"python"</span> | <span style="color: var(--green)">"go"</span> | <span style="color: var(--green)">"java"</span> | <span style="color: var(--green)">"kotlin"</span> | <span style="color: var(--green)">"ruby"</span> | <span style="color: var(--green)">"terraform"</span> | <span style="color: var(--green)">"cli"</span> | <span style="color: var(--green)">"php"</span> | <span style="color: var(--green)">"csharp"</span> | <span style="color: var(--green)">"http"</span>&gt;</span></code> <span><p>Skip SDK generation for a resource by specifying <code>skip: true</code>. Skip SDK generation for a resource per language by specifying the languages to skip (for example, <code>skip: [go, node]</code>). Skipping generation can aid in debugging code generation errors.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>only?</code></td><td><code><span>Array&lt;<span style="color: var(--green)">"node"</span> | <span style="color: var(--green)">"typescript"</span> | <span style="color: var(--green)">"python"</span> | <span style="color: var(--green)">"go"</span> | <span style="color: var(--green)">"java"</span> | <span style="color: var(--green)">"kotlin"</span> | <span style="color: var(--green)">"ruby"</span> | <span style="color: var(--green)">"terraform"</span> | <span style="color: var(--green)">"cli"</span> | <span style="color: var(--green)">"php"</span> | <span style="color: var(--green)">"csharp"</span> | <span style="color: var(--green)">"http"</span>&gt;</span></code> <span><p>Opposite of <code>skip</code>; if set, SDK generation is only performed for this resource.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>deprecated?</code></td><td><code><span><span style="color: var(--green)">string</span> | Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span>&gt;</span></code> <span><p>Set the deprecation message for this method</p>
    </span></td>
  </tr>
</table>

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type</code></td><td><code><span><span style="color: var(--green)">"alias"</span></span></code> <span><p>Describes an &#39;alias&#39; to a method in the same resource. Used mainly for renaming a method and maintaining backwards compatibility.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>to</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The name of the method that this alias should point to.</p>
    <p>This currently only supports aliasing HTTP methods within the same resource.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span> | Array&lt;<span style="color: var(--green)">"node"</span> | <span style="color: var(--green)">"typescript"</span> | <span style="color: var(--green)">"python"</span> | <span style="color: var(--green)">"go"</span> | <span style="color: var(--green)">"java"</span> | <span style="color: var(--green)">"kotlin"</span> | <span style="color: var(--green)">"ruby"</span> | <span style="color: var(--green)">"terraform"</span> | <span style="color: var(--green)">"cli"</span> | <span style="color: var(--green)">"php"</span> | <span style="color: var(--green)">"csharp"</span> | <span style="color: var(--green)">"http"</span>&gt;</span></code> <span><p>Skip SDK generation for a resource by specifying <code>skip: true</code>. Skip SDK generation for a resource per language by specifying the languages to skip (for example, <code>skip: [go, node]</code>). Skipping generation can aid in debugging code generation errors.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>only?</code></td><td><code><span>Array&lt;<span style="color: var(--green)">"node"</span> | <span style="color: var(--green)">"typescript"</span> | <span style="color: var(--green)">"python"</span> | <span style="color: var(--green)">"go"</span> | <span style="color: var(--green)">"java"</span> | <span style="color: var(--green)">"kotlin"</span> | <span style="color: var(--green)">"ruby"</span> | <span style="color: var(--green)">"terraform"</span> | <span style="color: var(--green)">"cli"</span> | <span style="color: var(--green)">"php"</span> | <span style="color: var(--green)">"csharp"</span> | <span style="color: var(--green)">"http"</span>&gt;</span></code> <span><p>Opposite of <code>skip</code>; if set, SDK generation is only performed for this resource.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>deprecated?</code></td><td><code><span><span style="color: var(--green)">string</span> | Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span>&gt;</span></code> <span><p>Set the deprecation message for this method</p>
    </span></td>
  </tr>
</table>

## Model - `resources.*.models.*` {#model}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type?</code></td><td><code><span><span style="color: var(--green)">"model"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>openapi_uri</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p><code>openapi_uri</code> is a reference to the OpenAPI definition of the schema, e.g. <code>#/components/schemas/Card</code> or <code>#/components/schemas/CardList/items</code>.</p>
    <p>All <code>$ref</code> and indirect references to the schema this path points to will have the same canonical name and share a type definition.</p>
    <p>For schemas under <code>#/components/schemas/*</code>, you can specify just the last path segment instead of the full JSON path (e.g. <code>Card</code> instead of <code>#/components/schemas/Card</code>).</p>
    <p>If you need a more powerful way to match a schema, <code>openapi_uri</code> can also be a <a href="https://jmespath.org/">JMESPath</a> or a <a href="https://jsonpath-plus.github.io/JSONPath/docs/ts/">JSONPath-plus</a> query. This query should match exactly one schema, and not mutate or create new references.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>no_params_suffix?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>used to disable the automatic addition of the <code>Params</code> suffix in the Python SDK</p>
    </span></td>
  </tr>
  <tr>
    <td><code>param_model?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The path to the model that is the param version of this response model. Results in generating utilities for converting from this response model to its param version.</p>
    <p>This should be in the format: <code>$resource.$model</code>.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span> | Array&lt;<span style="color: var(--green)">"node"</span> | <span style="color: var(--green)">"typescript"</span> | <span style="color: var(--green)">"python"</span> | <span style="color: var(--green)">"go"</span> | <span style="color: var(--green)">"java"</span> | <span style="color: var(--green)">"kotlin"</span> | <span style="color: var(--green)">"ruby"</span> | <span style="color: var(--green)">"terraform"</span> | <span style="color: var(--green)">"cli"</span> | <span style="color: var(--green)">"php"</span> | <span style="color: var(--green)">"csharp"</span> | <span style="color: var(--green)">"http"</span>&gt;</span></code> <span><p>Skip SDK generation for a resource by specifying <code>skip: true</code>. Skip SDK generation for a resource per language by specifying the languages to skip (for example, <code>skip: [go, node]</code>). Skipping generation can aid in debugging code generation errors.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>only?</code></td><td><code><span>Array&lt;<span style="color: var(--green)">"node"</span> | <span style="color: var(--green)">"typescript"</span> | <span style="color: var(--green)">"python"</span> | <span style="color: var(--green)">"go"</span> | <span style="color: var(--green)">"java"</span> | <span style="color: var(--green)">"kotlin"</span> | <span style="color: var(--green)">"ruby"</span> | <span style="color: var(--green)">"terraform"</span> | <span style="color: var(--green)">"cli"</span> | <span style="color: var(--green)">"php"</span> | <span style="color: var(--green)">"csharp"</span> | <span style="color: var(--green)">"http"</span>&gt;</span></code> <span><p>Opposite of <code>skip</code>; if set, SDK generation is only performed for this resource.</p>
    </span></td>
  </tr>
</table>

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type</code></td><td><code><span><span style="color: var(--green)">"alias"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>to</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Name of the model this alias should point to. Aliases must point to a model within the same resource.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>deprecated?</code></td><td><code><span><span style="color: var(--green)">string</span> | Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span>&gt;</span></code> <span><p>Set the deprecation message for this model</p>
    </span></td>
  </tr>
  <tr>
    <td><code>skip?</code></td><td><code><span><span style="color: purple">boolean</span> | Array&lt;<span style="color: var(--green)">"node"</span> | <span style="color: var(--green)">"typescript"</span> | <span style="color: var(--green)">"python"</span> | <span style="color: var(--green)">"go"</span> | <span style="color: var(--green)">"java"</span> | <span style="color: var(--green)">"kotlin"</span> | <span style="color: var(--green)">"ruby"</span> | <span style="color: var(--green)">"terraform"</span> | <span style="color: var(--green)">"cli"</span> | <span style="color: var(--green)">"php"</span> | <span style="color: var(--green)">"csharp"</span> | <span style="color: var(--green)">"http"</span>&gt;</span></code> <span><p>Skip SDK generation for a resource by specifying <code>skip: true</code>. Skip SDK generation for a resource per language by specifying the languages to skip (for example, <code>skip: [go, node]</code>). Skipping generation can aid in debugging code generation errors.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>only?</code></td><td><code><span>Array&lt;<span style="color: var(--green)">"node"</span> | <span style="color: var(--green)">"typescript"</span> | <span style="color: var(--green)">"python"</span> | <span style="color: var(--green)">"go"</span> | <span style="color: var(--green)">"java"</span> | <span style="color: var(--green)">"kotlin"</span> | <span style="color: var(--green)">"ruby"</span> | <span style="color: var(--green)">"terraform"</span> | <span style="color: var(--green)">"cli"</span> | <span style="color: var(--green)">"php"</span> | <span style="color: var(--green)">"csharp"</span> | <span style="color: var(--green)">"http"</span>&gt;</span></code> <span><p>Opposite of <code>skip</code>; if set, SDK generation is only performed for this resource.</p>
    </span></td>
  </tr>
</table>

## Readme - `readme` {#readme}

<p>Configuration of the examples in the README.md of the generated SDKs.

Learn more: https://www.stainless.com/docs/guides/configure#readme</p>

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>example_requests</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  default: <a href="#readme-example-method">ReadmeExampleMethod</a>,<br/>  headline: <a href="#readme-example-method">ReadmeExampleMethod</a>,<br/>  <span style="color: gray">// Example of how to handle errors in the SDK. <br/>  //  <br/>  // NOTE: Even though this is an &quot;error&quot; example, it <br/>  // should be well-formed! (E.g. it shouldn&apos;t have <br/>  // missing or invalid parameters.) <br/>  // It demonstrates how to handle network errors and <br/>  // the like, not how to handle malformed requests, <br/>  // since the SDK ensures that requests are <br/>  // well-formed. <br/>  </span>errors?: <a href="#readme-example-method">ReadmeExampleMethod</a> & &#123;<br/>    example_properties?: Record&lt;<span style="color: var(--green)">string</span>, unknown&gt;,<br/>  &#125;,<br/>  retries?: <a href="#readme-example-method">ReadmeExampleMethod</a>,<br/>  nested_params?: <a href="#readme-example-method">ReadmeExampleMethod</a>,<br/>  http_agent?: <a href="#readme-example-method">ReadmeExampleMethod</a>,<br/>  raw_response?: <a href="#readme-example-method">ReadmeExampleMethod</a>,<br/>  timeouts?: <a href="#readme-example-method">ReadmeExampleMethod</a>,<br/>  default_headers?: <a href="#readme-example-method">ReadmeExampleMethod</a>,<br/>  pagination?: <a href="#readme-example-method">ReadmeExampleMethod</a>,<br/>  streaming?: <a href="#readme-example-method">ReadmeExampleMethod</a>,<br/>  file_uploads?: &#123;<br/>    type: <span style="color: var(--green)">"request"</span>,<br/>    <span style="color: gray">// Endpoint to use as the example method, in the <br/>    // format `post /foo/bar/{id}` <br/>    </span>endpoint: <span style="color: var(--green)">string</span>,<br/>    <span style="color: gray">// The request params to include in the example. <br/>    //  <br/>    // e.g. <br/>    //  <br/>    // params: <br/>    //   query_param: &apos;foo&apos; <br/>    //   body_param: true <br/>    //   path_param: id <br/>    </span>params: Record&lt;<span style="color: var(--green)">string</span>, unknown&gt;,<br/>    <span style="color: gray">// The property on the response to log, e.g. `id` on <br/>    // a `get /accounts` endpoints adds a <br/>    // `console.log(account.id)` or equivalent in the <br/>    // example <br/>    </span>response_property?: <span style="color: var(--green)">string</span>,<br/>    assign_to?: <span style="color: var(--green)">string</span>,<br/>    file_param: <span style="color: var(--green)">string</span>,<br/>    file_path?: <span style="color: var(--green)">string</span>,<br/>  &#125;,<br/>&#125;</span></code> <span><p>Configuration for the request examples used in the README.md for the various SDKs. Each example by default inherits off the default endpoint, and the default endpoint must have a response body.</p>
    <p>We suggest you use the most standard endpoint for the <code>default</code> example, and the most important example for the <code>headline</code> example</p>
    </span></td>
  </tr>
  <tr>
    <td><code>example_types?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  object?: <a href="#readme-example-model-object">ReadmeExampleModelObject</a>,<br/>  nullable?: <a href="#readme-example-model-object">ReadmeExampleModelObject</a>,<br/>  enum?: <a href="#readme-example-model-enum">ReadmeExampleModelEnum</a>,<br/>  union?: <a href="#readme-example-model-object">ReadmeExampleModelObject</a>,<br/>  intersection?: <a href="#readme-example-model-object">ReadmeExampleModelObject</a>,<br/>&#125;</span></code> <span><p>Configuration for the models/types to use for demonstration of how to instantiate and access different types in the SDK.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>include_stainless_attribution?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Include a powered by Stainless attribution in the readme</p>
    </span></td>
  </tr>
</table>

### ReadmeExampleMethod {#readme-example-method}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type</code></td><td><code><span><span style="color: var(--green)">"request"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>endpoint</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Endpoint to use as the example method, in the format <code>post /foo/bar/&#123;id&#125;</code></p>
    </span></td>
  </tr>
  <tr>
    <td><code>params</code></td><td><code><span>Record&lt;<span style="color: var(--green)">string</span>, unknown&gt;</span></code> <span><p>The request params to include in the example.</p>
    <p>e.g.</p>
    <p>params:
      query_param: &#39;foo&#39;
      body_param: true
      path_param: id</p>
    </span></td>
  </tr>
  <tr>
    <td><code>response_property?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The property on the response to log, e.g. <code>id</code> on a <code>get /accounts</code> endpoints adds a <code>console.log(account.id)</code> or equivalent in the example</p>
    </span></td>
  </tr>
  <tr>
    <td><code>assign_to?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span></span></td>
  </tr>
</table>

### ReadmeExampleModelObject {#readme-example-model-object}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type</code></td><td><code><span><span style="color: var(--green)">"model"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>model</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The dotted path to the model defined in the config.</p>
    <p>For example, a &#39;transaction&#39; model defined in the &#39;cards.transactions&#39;
    resource would be &#39;cards.transactions.transaction&#39;</p>
    </span></td>
  </tr>
  <tr>
    <td><code>property</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The property on the model schema to use as an example</p>
    </span></td>
  </tr>
</table>

### ReadmeExampleModelEnum {#readme-example-model-enum}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type</code></td><td><code><span><span style="color: var(--green)">"model"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>model</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The dotted path to the model defined in the config.</p>
    <p>For example, a &#39;transaction&#39; model defined in the &#39;cards.transactions&#39;
    resource would be &#39;cards.transactions.transaction&#39;</p>
    </span></td>
  </tr>
  <tr>
    <td><code>option</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>The enum member to reference in examples</p>
    </span></td>
  </tr>
</table>

## `pagination` {#pagination}

<div className="details-group">

</div>

### PaginationScheme {#pagination-scheme}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>name</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>description?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>type</code></td><td><code><span><span style="color: var(--green)">"cursor"</span> | <span style="color: var(--green)">"cursor_id"</span> | <span style="color: var(--green)">"cursor_url"</span> | <span style="color: var(--green)">"fake_page"</span> | <span style="color: var(--green)">"offset"</span> | <span style="color: var(--green)">"page_number"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>request</code></td><td><code><span>Record&lt;<span style="color: var(--green)">string</span>, unknown&gt;</span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>response</code></td><td><code><span>Record&lt;<span style="color: var(--green)">string</span>, unknown&gt;</span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>param_location?</code></td><td><code><span><span style="color: var(--green)">"query"</span> | <span style="color: var(--green)">"body"</span></span></code> <span></span></td>
  </tr>
</table>

### PaginationProperty {#pagination-property}

key: `x-stainless-pagination-property`

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>is_top_level_array?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Are the pagination items the direct, root-level response from the endpoint?</p>
    </span></td>
  </tr>
  <tr>
    <td><code>from_header?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Which header value the pagination config property should be pulled from</p>
    </span></td>
  </tr>
  <tr>
    <td><code>purpose?</code></td><td><code><span><span style="color: var(--green)">"items"</span> | <span style="color: var(--green)">"has_next_page"</span> | <span style="color: var(--green)">"next_cursor_param"</span> | <span style="color: var(--green)">"next_cursor_field"</span> | <span style="color: var(--green)">"previous_cursor_param"</span> | <span style="color: var(--green)">"previous_cursor_field"</span> | <span style="color: var(--green)">"cursor_item_id"</span> | <span style="color: var(--green)">"next_cursor_id_param"</span> | <span style="color: var(--green)">"previous_cursor_id_param"</span> | <span style="color: var(--green)">"cursor_url_field"</span> | <span style="color: var(--green)">"page_number_param"</span> | <span style="color: var(--green)">"current_page_number_field"</span> | <span style="color: var(--green)">"total_page_count_field"</span> | <span style="color: var(--green)">"offset_total_count_field"</span> | <span style="color: var(--green)">"offset_count_start_field"</span> | <span style="color: var(--green)">"offset_count_param"</span></span></code> <span><p>The purpose of the pagination property. More details and examples can be found in <a href="/docs/guides/configure#pagination">our Pagination docs</a></p>
    <p>Generic:</p>
    <ul>
    <li><code>items</code> response field containing the items in the page</li>
    </ul>
    <p>Type: <code>offset</code></p>
    <ul>
    <li><code>offset_total_count_field</code> response field indicating the total number of results available to be fetched</li>
    <li><code>offset_count_start_field</code> response field indicating the offset count used to fetch the next page</li>
    <li><code>offset_count_param</code> request param used to fetch the next offset page</li>
    </ul>
    <p>Type: <code>cursor</code></p>
    <ul>
    <li><code>next_cursor_param</code> request param used to fetch the next page</li>
    <li><code>previous_cursor_param</code> request param used to fetch the previous page</li>
    <li><code>next_cursor_field</code> response field indicating the cursor value used to fetch the next page</li>
    </ul>
    <p>Type: <code>cursor_id</code></p>
    <ul>
    <li><code>cursor_item_id</code> response field indicating the cursor ID used to fetch the next page</li>
    <li><code>next_cursor_id_param</code> request param used to fetch the next page</li>
    <li><code>previous_cursor_id_param</code> request param used to fetch the previous page</li>
    </ul>
    <p>Type: <code>cursor_url</code></p>
    <ul>
    <li><code>cursor_url_field</code> response field indicating the URL used to fetch the next page</li>
    </ul>
    <p>Type: <code>page_number</code></p>
    <ul>
    <li><code>page_number_param</code> request param used to fetch the next page</li>
    <li><code>current_page_number_field</code> response field indicating the current page number</li>
    <li><code>total_page_count_field</code> response field indicating the total number of pages available</li>
    </ul>
    </span></td>
  </tr>
  <tr>
    <td><code>required?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span></span></td>
  </tr>
</table>

## Settings - `settings` {#settings}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>sort_schema_properties?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Whether or not to sort schema properties before outputting types. Defaults to <code>true</code></p>
    </span></td>
  </tr>
  <tr>
    <td><code>license?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;"><span style="color: var(--green)">"Apache-2.0"</span> | <span style="color: var(--green)">"MIT"</span> | &#123;<br/>  <span style="color: gray">// The name given to this license, should be a valid <br/>  // SPDX identifier <br/>  </span>name: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// The license contents. <br/>  </span>contents: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// The file extension that the LICENSE file will be <br/>  // generated to <br/>  </span>extension?: <span style="color: var(--green)">string</span>,<br/>&#125;</span></code> <span><p>License to use in all SDKs (defaults to Apache-2.0)</p>
    </span></td>
  </tr>
  <tr>
    <td><code>python?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// The license classifier to use in the Python <br/>  // package metadata. https://pypi.org/classifiers/ <br/>  </span>license_classifier?: <span style="color: var(--green)">string</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>disable_mock_tests?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>If set to true, all generated integration tests that hit the <a href="https://stoplight.io/open-source/prism">prism mock http server</a> are marked as skipped.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>unwrap_response_fields?</code></td><td><code><span>Array&lt;<span style="color: var(--green)">string</span>&gt;</span></code> <span><p>Response envelopes, like a top-level &quot;data&quot; field, can be described here with [data]</p>
    </span></td>
  </tr>
  <tr>
    <td><code>positional_params?</code></td><td><code><span>false</span></code> <span><p>If specified as false, then we disable positional params for the entire SDK.</p>
    </span></td>
  </tr>
</table>

## ClientSettings - `client_settings` {#client-settings}

<p>Settings for customizing the [Client class](https://www.stainless.com/docs/guides/configure#client) in the SDKs.</p>
<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>opts?</code></td><td><code><span>Record&lt;<span style="color: var(--green)">string</span>, <a href="#client-opt">ClientOpt</a>&gt;</span></code> <span><p>Extra arguments that the client accepts, such as an API key.</p>
    <p>Learn more: <a href="https://www.stainless.com/docs/guides/configure#client-opts">https://www.stainless.com/docs/guides/configure#client-opts</a></p>
    </span></td>
  </tr>
  <tr>
    <td><code>idempotency?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Header to send the idempotency token in <br/>  </span>header: <span style="color: var(--green)">string</span>,<br/>&#125;</span></code> <span><p>Configure <a href="https://www.stainless.com/docs/guides/configure#idempotency-key">idempotency behaviour</a></p>
    </span></td>
  </tr>
  <tr>
    <td><code>default_headers?</code></td><td><code><span>Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span>&gt;</span></code> <span><p>Headers sent with every API request</p>
    </span></td>
  </tr>
  <tr>
    <td><code>default_timeout?</code></td><td><code><span><span style="color: var(--green)">string</span> | <span style="color: purple">number</span></span></code> <span><p>Configure the <a href="https://www.stainless.com/docs/guides/configure#timeouts">default timeout for client calls</a>, in milliseconds or ISO 8601 (default is 60 seconds)</p>
    </span></td>
  </tr>
  <tr>
    <td><code>default_retries?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Maximum number of times to retry for all <br/>  // endpoints. Use 0 to disable retries. <br/>  </span>max_retries: <span style="color: purple">integer</span>,<br/>  <span style="color: gray">// Seconds to wait before the first retry. <br/>  </span>initial_delay_seconds: <span style="color: purple">number</span>,<br/>  <span style="color: gray">// We increase the retry time with exponential <br/>  // backoff, each retry taking twice as long as the <br/>  // last, until this value of max seconds to retry. <br/>  </span>max_delay_seconds: <span style="color: purple">number</span>,<br/>&#125;</span></code> <span><p>Default <a href="https://www.stainless.com/docs/guides/configure#retries">retry settings</a> for all endpoints.</p>
    </span></td>
  </tr>
</table>

### ClientOpt {#client-opt}

key: `client_settings.opts.*`

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type</code></td><td><code><span><span style="color: var(--green)">"null"</span> | <span style="color: var(--green)">"boolean"</span> | <span style="color: var(--green)">"number"</span> | <span style="color: var(--green)">"string"</span> | <span style="color: var(--green)">"integer"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>description?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Description used for this option in the generated SDKs</p>
    </span></td>
  </tr>
  <tr>
    <td><code>example?</code></td><td><code><span>unknown</span></code> <span><p>Example value used in tests or example snippets</p>
    </span></td>
  </tr>
  <tr>
    <td><code>default?</code></td><td><code><span>unknown</span></code> <span><p>Default value to use if no value provided by the user</p>
    </span></td>
  </tr>
  <tr>
    <td><code>nullable?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Whether this client option is required</p>
    </span></td>
  </tr>
  <tr>
    <td><code>read_env?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Environment variable that this option should read from</p>
    </span></td>
  </tr>
  <tr>
    <td><code>auth?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  security_scheme: <span style="color: var(--green)">string</span>,<br/>  role?: <span style="color: var(--green)">"value"</span> | <span style="color: var(--green)">"username"</span> | <span style="color: var(--green)">"password"</span> | <span style="color: var(--green)">"client_id"</span> | <span style="color: var(--green)">"client_secret"</span>,<br/>&#125;</span></code> <span><p>Configure <a href="https://www.stainless.com/docs/guides/configure#authentication">authentication</a> for this client option.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>server_variable?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Links this client option to a variable in the url configured by <code>environments</code>.</p>
    <pre><code class="language-yaml">environments:
      production: https://{region}.acme.com
    </code></pre>
    <p>Then <code>server_variable: &quot;region&quot;</code> will mean the value of the <code>&#123;region&#125;</code> will be replaced by the value of this client option.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>send_in_header?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Send the value given to this option in a header on every request</p>
    </span></td>
  </tr>
  <tr>
    <td><code>required_in_tests?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Whether to provide this argument in unit tests. Set to true if this argument is required for internal request tests to run successfully</p>
    </span></td>
  </tr>
</table>

## QuerySettings - `query_settings` {#query-settings}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>nested_format?</code></td><td><code><span><span style="color: var(--green)">"dots"</span> | <span style="color: var(--green)">"brackets"</span></span></code> <span><p>Configures how query parameters with nested objects render in the query string. Accepted values are <code>brackets</code> (the default) and <code>dots</code>.</p>
    <p>Example object: <code>&#123; a: &#123; b: &quot;c&quot; &#125; &#125;</code></p>
    <ul>
    <li>brackets syntax -&gt; <code>a[b]=c</code></li>
    <li>dot syntax -&gt; <code>a.b=c</code></li>
    </ul>
    </span></td>
  </tr>
  <tr>
    <td><code>array_format?</code></td><td><code><span><span style="color: var(--green)">"comma"</span> | <span style="color: var(--green)">"repeat"</span> | <span style="color: var(--green)">"indices"</span> | <span style="color: var(--green)">"brackets"</span></span></code> <span><p>Configures how query parameters with array values render in the query string. Accepted values are <code>brackets</code>, <code>comma</code> (the default), and <code>repeat</code>.</p>
    <p>Example object: <code>&#123; in: [&quot;foo&quot;, &quot;bar&quot;] &#125;</code></p>
    <ul>
    <li>brackets syntax -&gt; <code>in[]=foo&amp;in[]=bar</code></li>
    <li>comma syntax -&gt; <code>in=foo,bar</code></li>
    <li>repeat syntax -&gt; <code>in=foo&amp;in=bar</code></li>
    </ul>
    </span></td>
  </tr>
</table>

## SecurityConfig - `security_config` {#security-config}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>[key: string]</code></td><td>[<code><span>Array&lt;<span style="color: var(--green)">string</span>&gt;</span></code>] </td>
  </tr>
</table>

## SecurityScheme - `security_schemes` {#security-scheme}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type</code></td><td><code><span><span style="color: var(--green)">"http"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>description?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>scheme</code></td><td><code><span><span style="color: var(--green)">"bearer"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>bearerFormat?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>x-stainless-auth?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  scheme_keyword?: <span style="color: var(--green)">string</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
</table>

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type</code></td><td><code><span><span style="color: var(--green)">"http"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>description?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>scheme</code></td><td><code><span><span style="color: var(--green)">"basic"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>x-stainless-auth?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  disable_base64?: <span style="color: purple">boolean</span>,<br/>  scheme_keyword?: <span style="color: var(--green)">string</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
</table>

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type</code></td><td><code><span><span style="color: var(--green)">"http"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>description?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>scheme</code></td><td><code><span><span style="color: var(--green)">"digest"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>x-stainless-auth?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  scheme_keyword?: <span style="color: var(--green)">string</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
</table>

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type</code></td><td><code><span><span style="color: var(--green)">"apiKey"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>description?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>in?</code></td><td><code><span><span style="color: var(--green)">"header"</span> | <span style="color: var(--green)">"query"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>name</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>x-stainless-auth?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  custom: <span style="color: var(--green)">string</span>,<br/>&#125;</span></code> <span></span></td>
  </tr>
</table>

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>type</code></td><td><code><span><span style="color: var(--green)">"oauth2"</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>description?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span></span></td>
  </tr>
  <tr>
    <td><code>flows</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  implicit?: &#123;<br/>    authorizationUrl: <span style="color: var(--green)">string</span>,<br/>    refreshUrl?: <span style="color: var(--green)">string</span>,<br/>    scopes: Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span>&gt;,<br/>  &#125;,<br/>  password?: &#123;<br/>    tokenUrl: <span style="color: var(--green)">string</span>,<br/>    refreshUrl?: <span style="color: var(--green)">string</span>,<br/>    scopes: Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span>&gt;,<br/>  &#125;,<br/>  clientCredentials?: &#123;<br/>    tokenUrl: <span style="color: var(--green)">string</span>,<br/>    refreshUrl?: <span style="color: var(--green)">string</span>,<br/>    scopes: Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span>&gt;,<br/>  &#125;,<br/>  authorizationCode?: &#123;<br/>    authorizationUrl: <span style="color: var(--green)">string</span>,<br/>    tokenUrl: <span style="color: var(--green)">string</span>,<br/>    refreshUrl?: <span style="color: var(--green)">string</span>,<br/>    scopes: Record&lt;<span style="color: var(--green)">string</span>, <span style="color: var(--green)">string</span>&gt;,<br/>  &#125;,<br/>&#125;</span></code> <span></span></td>
  </tr>
</table>

## OpenAPIConfig - `openapi` {#open-api-config}

<p>Describes changes to the input OpenAPI spec and also whether or not to add code samples to the output OpenAPI spec.</p>
<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>code_samples?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// adds `x-readme.samples-languages` <br/>  </span>readme?: <span style="color: purple">boolean</span>,<br/>  <span style="color: gray">// alias for `x-codeSamples` <br/>  </span>redocly?: <span style="color: purple">boolean</span>,<br/>  <span style="color: gray">// alias for `x-codeSamples` <br/>  </span>mintlify?: <span style="color: purple">boolean</span>,<br/>  <span style="color: gray">// alias for `x-codeSamples` <br/>  </span>bump.sh?: <span style="color: purple">boolean</span>,<br/>  <span style="color: gray">// alias for `x-codeSamples` <br/>  </span>gitbook?: <span style="color: purple">boolean</span>,<br/>  <span style="color: gray">// alias for `x-codeSamples` <br/>  </span>x-codeSamples?: <span style="color: purple">boolean</span>,<br/>  <span style="color: gray">// adds `x-stainless-snippets` <br/>  </span>stainless?: <span style="color: purple">boolean</span>,<br/>&#125; | <span style="color: var(--green)">"readme"</span> | <span style="color: var(--green)">"redocly"</span> | <span style="color: var(--green)">"mintlify"</span> | <span style="color: var(--green)">"bump.sh"</span> | <span style="color: var(--green)">"gitbook"</span> | <span style="color: var(--green)">"x-codeSamples"</span> | <span style="color: var(--green)">"stainless"</span></span></code> <span><p>Defines automatic snippet generation directly into your OpenAPI spec.</p>
    <p>Supported providers:</p>
    <ul>
    <li><a href="https://readme.com/">readme</a></li>
    <li><a href="https://redocly.com/docs/api-reference-docs/specification-extensions/x-code-samples/">x-codeSamples</a></li>
    <li><a href="https://bump.sh/">bump.sh</a>, alias for <code>x-codeSamples</code></li>
    <li><a href="https://www.gitbook.com/">gitbook</a>, alias for <code>x-codeSamples</code></li>
    <li><a href="https://redocly.com/">redocly</a>, alias for <code>x-codeSamples</code></li>
    <li><a href="https://mintlify.com/">mintlify</a>, alias for <code>x-codeSamples</code></li>
    <li>stainless, adds <code>x-stainless-snippets</code></li>
    </ul>
    </span></td>
  </tr>
  <tr>
    <td><code>code_sample_languages?</code></td><td><code><span>Record&lt;<span style="color: var(--green)">string</span>, <span style="color: purple">boolean</span>&gt;</span></code> <span><p>Controls which languages to include in generated code samples.</p>
    <p>By default, all languages configured in <code>targets</code> are enabled, and curl, powershell are disabled.</p>
    </span></td>
  </tr>
</table>

## `custom_casings`

### InitialismConfig {#initialism-config}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>initialism</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>If set to true, the term is used as an initialism: treated as an abbreviation of initial letters (for example, &quot;CPU&quot; and &quot;API&quot;).
    If set to false, the term is removed from the set of initialisms.</p>
    <p>By default we use <code>[3ds, ach, acl, ai, api, ats, cpu, crm, db, dns, e2e, eeoc, gb, gpu, hd, hris, html, http, https, id, ip, iso, jsonl, kb, kyb, kyc, lfs, mb, mp3, mp4, nft, saml, sdk, sku, sms, ss, ssh, sso, url]</code> as initialisms.</p>
    </span></td>
  </tr>
</table>

### CasingConfig {#casing-config}

<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>snake</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Term rendered with lowercase characters separated by underscores (for example, &quot;payment_method&quot;).</p>
    </span></td>
  </tr>
  <tr>
    <td><code>pascal</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Term rendered with the first character of each word capitalized and joined together (for example, &quot;PaymentMethod&quot;).</p>
    </span></td>
  </tr>
  <tr>
    <td><code>capital</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Term rendered with the first character of each word capitalized and separated by a space (for example, &quot;Payment Method&quot;).</p>
    </span></td>
  </tr>
  <tr>
    <td><code>camel</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Term rendered with the first word in lowercase, followed by the first character of each subsequent word capitalized and joined together (for example, &quot;paymentMethod&quot;).</p>
    </span></td>
  </tr>
</table>

## ErrorsConfig - `errors` {#errors-config}

<p>Defines custom error types in the SDKs.</p>
<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>union?</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">&#123;<br/>  <span style="color: gray">// Points to a union schema where each entry is an <br/>  // error schema. <br/>  </span>source: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// The property that is used as a discriminator, <br/>  // e.g. `type` <br/>  </span>discriminator: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// The enum property that indicates what status <br/>  // code(s) the schema should be used for. <br/>  </span>status_property: <span style="color: var(--green)">string</span>,<br/>  <span style="color: gray">// Customise each individual variant. <br/>  </span>variants?: Record&lt;<span style="color: var(--green)">string</span>, &#123;<br/>    <span style="color: gray">// Indicate that this error should be raised when <br/>    // the given status code is returned. <br/>    </span>status_code?: <span style="color: purple">integer</span>,<br/>    <span style="color: gray">// By default the value of the discriminated <br/>    // property is used as the name for the error. <br/>    //  <br/>    // This field expects an object where the key is the <br/>    // value of the discriminator property and the value <br/>    // is the new name. <br/>    //  <br/>    // For example, you can change the name for an error <br/>    // with `type: &apos;api_method_not_found_error&apos;` like <br/>    // so: <br/>    //  <br/>    // ```yaml <br/>    // variants: <br/>    //   api_method_not_found_error: <br/>    //     name: not_found_error <br/>    // ``` <br/>    </span>name?: <span style="color: var(--green)">string</span>,<br/>  &#125;&gt;,<br/>&#125;</span></code> <span><p>Configure error types from a discriminated union of error responses</p>
    </span></td>
  </tr>
  <tr>
    <td><code>message_property?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>Response property to use for the error message.</p>
    </span></td>
  </tr>
</table>

## CodeflowConfig - `codeflow` {#codeflow-config}

<p>Configures various codeflow (automated releases to package managers) options.</p>
<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>release_environment?</code></td><td><code><span><span style="color: var(--green)">string</span></span></code> <span><p>GitHub environment to run the release workflow in.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>publish_packages?</code></td><td><code><span><span style="color: purple">boolean</span></span></code> <span><p>Whether publishing to package managers should be included in GitHub automations.</p>
    </span></td>
  </tr>
  <tr>
    <td><code>reviewers?</code></td><td><code><span>Array&lt;<span style="color: var(--green)">string</span>&gt;</span></code> <span><p>List of default reviewers to assign to a customer release PR</p>
    </span></td>
  </tr>
  <tr>
    <td><code>code_owners?</code></td><td><code><span>Record&lt;<span style="color: var(--green)">string</span>, Array&lt;<span style="color: var(--green)">string</span>&gt;&gt;</span></code> <span><p>Github CODEOWNERS file content to add to SDK repositories</p>
    <p>Example:</p>
    <pre><code>code_owners:
      &#39;*&#39;: [&#39;@acme/sdk-team-1&#39;]
      &#39;src/**&#39;: [&#39;@acme/sdk-team-2&#39;]
    </code></pre>
    </span></td>
  </tr>
</table>

## DiagnosticsConfig - `diagnostics` {#diagnostics-config}

<p>Configures diagnostics that appear in builds and the Studio.</p>
<table>
  <tr>
    <th>Key</th><th>Description</th>
  </tr>
  <tr>
    <td><code>ignored</code></td><td><code style="white-space: pre; display: block; overflow-x: auto;"><span style="display: block; width: 0;">Record&lt;<span style="color: var(--green)">string</span>, true | Array&lt;<span style="color: var(--green)">string</span> | &#123;<br/>  location: <span style="color: var(--green)">string</span>,<br/>  reason: <span style="color: var(--green)">string</span>,<br/>&#125; | &#123;<br/>  target: <a href="#supported-language">SupportedLanguage</a>,<br/>  reason: <span style="color: var(--green)">string</span>,<br/>&#125;&gt;&gt;</span></code> <span><p>Diagnostic types to ignore.</p>
    </span></td>
  </tr>
</table>
