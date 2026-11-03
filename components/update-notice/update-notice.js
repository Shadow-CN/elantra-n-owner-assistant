var version = require('../../utils/version')

Component({
  data: { changelog: null, changelogVisible: false },
  lifetimes: {
    ready() {
      this._ready = true
      if (this._pageVisible !== false) this._checkVersion()
    },
    detached() { this._ready = false },
  },
  pageLifetimes: {
    show() {
      this._pageVisible = true
      if (this._ready) this._checkVersion()
    },
    hide() {
      this._pageVisible = false
      this.setData({ changelogVisible: false })
    },
  },
  methods: {
    _checkVersion() {
      var update = version.pendingUpdate()
      this.setData({ changelog: update, changelogVisible: !!update })
    },
    onChangelogClose() {
      if (this.data.changelog) version.markSeen(this.data.changelog.version)
      this.setData({ changelogVisible: false })
    },
    onChangelogBodyTap() {},
  },
})
