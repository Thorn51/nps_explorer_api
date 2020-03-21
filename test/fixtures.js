function makeUsersArray() {
  return [
    {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "jdoe@devevlopmenttesting.com",
      password: "notRealForDev!1",
      nickname: null,
      home_state: null,
      date_created: "2020-12-21T07:00:00.000Z"
    },
    {
      id: 2,
      first_name: "Luke",
      last_name: "Doe",
      email: "ldoe@devevlopmenttesting.com",
      password: "notRealForDev2!",
      nickname: "nps_friend",
      home_state: "CO",
      date_created: "2020-12-21T07:00:00.000Z"
    },
    {
      id: 3,
      first_name: "Bob",
      last_name: "Doe",
      email: "bdoe@devevlopmenttesting.com",
      password: "notRealForDev3!",
      nickname: null,
      home_state: "WY",
      date_created: "2020-12-21T07:00:00.000Z"
    },
    {
      id: 4,
      first_name: "Steve",
      last_name: "Doe",
      email: "sdoe@devevlopmenttesting.com",
      password: "notRealForDev4!",
      nickname: "parks_lover",
      home_state: null,
      date_created: "2020-12-21T07:00:00.000Z"
    }
  ];
}

function makeXssUser() {
  return [
    {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "jdoe@devevlopmenttesting.com",
      password: "notRealForDev!1",
      nickname: null,
      home_state: null,
      date_created: "2020-12-21T07:00:00.000Z"
    },
    {
      id: 2,
      first_name: '<script>alert("xss");</script>',
      last_name:
        '<img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
      email: '<script>alert("xss");</script>',
      password: '<script>alert("xss");</script>',
      nickname: '<script>alert("xss");</script>',
      date_created: "2020-01-30T07:00:00.000Z",
      home_state: null,
      date_created: "2020-01-30T07:00:00.000Z"
    }
  ];
}

module.exports = {
  makeUsersArray,
  makeXssUser
};
