package io.ravencrest.covid19.model

data class TimeSeries(val country: String, val population: Long, val points: Set<Point>) {
  fun last(index: Int? = null): Point? {
    val point = this.points.lastOrNull()
    if (index != null) {
      return point?.copy(rank = index + 1)
    }
    return point
  }
}