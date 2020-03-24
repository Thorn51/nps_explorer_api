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
      home_state: null,
      date_created: "2020-01-30T07:00:00.000Z"
    }
  ];
}

function makeCommentsArray() {
  return [
    {
      id: 1,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-01-30T07:00:00.000Z",
      author_id: 2,
      author_name: "Bob",
      park_code: "yell"
    },
    {
      id: 2,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-01-30T07:00:00.000Z",
      author_id: 3,
      author_name: "Tom",
      park_code: "rmn"
    },
    {
      id: 3,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-01-30T07:00:00.000Z",
      author_id: 4,
      author_name: "Carol",
      park_code: "yipsy"
    },
    {
      id: 4,
      author_id: 1,
      author_name: "Jane",
      park_code: "obo",
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-01-30T07:00:00.000Z"
    }
  ];
}

function makeXssComment() {
  return [
    {
      id: 1,
      comment_text: '<script>alert("xss");</script>',
      author_name: "Jerk",
      date_submitted: "2020-01-30T07:00:00.000Z",
      author_id: 2,
      park_code: "yell"
    }
  ];
}

function makeFavoriteParksArray() {
  return [
    {
      id: 1,
      user_account: 4,
      park_code: "yell",
      favorite: false
    },
    {
      id: 2,
      user_account: 3,
      park_code: "rmn",
      favorite: true
    },
    {
      id: 3,
      user_account: 2,
      park_code: "yose",
      favorite: false
    },
    {
      id: 4,
      user_account: 1,
      park_code: "glac",
      favorite: true
    }
  ];
}

module.exports = {
  makeUsersArray,
  makeXssUser,
  makeCommentsArray,
  makeXssComment,
  makeFavoriteParksArray
};
