# Statechain

[![Build Status](https://travis-ci.com/KevinKelbie/statechains-server.svg?token=fF7uR2XTCqqPgvdmqsLt&branch=master)](https://travis-ci.com/KevinKelbie/statechains-server)

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/)
- [Mocha](https://mochajs.org/)

### Installing

    git clone https://github.com/KevinKelbie/statechain

## Deployment

## Config



## Built With

    docker build -t statechain-server .
    docker-compose up

## Running the tests

    yarn run test

## Contributing

Please read [CONTRIBUTING.md]() for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Kevin Kelbie** - *Initial work* - [@KevinKelbie](https://twitter.com/KevinKelbie)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* **Ruben Somsen** - *[Statechains White Paper](https://github.com/RubenSomsen/rubensomsen.github.io/blob/master/img/statechains.pdf)* - [@SomsenRuben](https://twitter.com/SomsenRuben)

MacOS:

    docker-machine rm default
    docker-machine create default --driver virtualbox
    eval "$(docker-machine env default)"
    docker-machine ip default

<br>

    docker build -t statechain-server .
    docker-compose up
