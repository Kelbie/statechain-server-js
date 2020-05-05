# Statechain.toml Configuration File

All commands-line options mentioned below may also be specified in the configuration file. Command-line options override those set in the configuration file.

# Statechain Environment Variables

<table>
  <thead>
    <tr>
      <td><b>Command</b></td>
      <td><b>Description</b></td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>-seed=&lt;str&gt;</code></td>
      <td>BIP39 compliant seed</td>
    </tr>
    <tr>
      <td colspan="2"><b>Federation</b></td>
    </tr>
    <tr>
      <td><code>-federation.id=&lt;int&gt;</code></td>
      <td>This id should be the same among other signers in the federation</td>
    </tr>
    <tr>
      <td><code>-federation.domain=&lt;str&gt;</code></td>
      <td></td>
    </tr>
    <tr>
      <td><code>-federation.path=&lt;str&gt;</code></td>
      <td>BIP32 derivation path ex. (<code>"m/420/&lt;federation.id&gt;/&lt;i&gt;"</code>)</td>
    </tr>
    <tr>
      <td><code>-federation.signers=[&lt;str&gt;]</code></td>
      <td>A list of strings that specify the ip and port to connect to other signers ex. (<code>["127.0.0.1:5000", "127.0.0.2:5000"]</code>)</td>
    </tr>
  </tbody>
</table>