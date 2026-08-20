function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    position: user.position,
    location: user.location,
    clubStatus: user.clubStatus,
    role: user.role,
  };
}

module.exports = {
  publicUser,
};
